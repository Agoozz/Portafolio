import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { buildRecommendationPrompt } from './promptBuilder.js';

export let currentConcurrentAiRequests = 0;
const MAX_CONCURRENT_AI = 5;
export let maxObservedConcurrency = 0;

export function tryAcquireAiSlot() {
    if (currentConcurrentAiRequests >= MAX_CONCURRENT_AI) {
        return false;
    }
    currentConcurrentAiRequests++;
    if (currentConcurrentAiRequests > maxObservedConcurrency) {
        maxObservedConcurrency = currentConcurrentAiRequests;
    }
    return true;
}

export function releaseAiSlot() {
    if (currentConcurrentAiRequests <= 0) {
        throw new Error("FATAL_CONCURRENCY_NEGATIVE");
    }
    currentConcurrentAiRequests--;
}

export const resetConcurrentAiRequests = () => { 
    currentConcurrentAiRequests = 0; 
    maxObservedConcurrency = 0;
};

const noEmptySpaces = (val) => val.trim().length > 0;

const ProductSchema = z.object({
    id: z.string().trim().min(1).max(50).refine(noEmptySpaces, "No puede ser vacío"),
    name: z.string().trim().min(1).max(100).refine(noEmptySpaces, "No puede ser vacío"),
    category: z.string().trim().min(1).max(50).refine(noEmptySpaces, "No puede ser vacío"),
    price: z.number().finite().nonnegative().max(1000000), 
    stock: z.number().int().nonnegative().max(1000000), 
    barcode: z.string().trim().regex(/^[a-zA-Z0-9-]*$/, "Solo alfanumérico y guiones").max(100).optional().or(z.literal(''))
}).strict(); 

const CartItemSchema = z.object({
    product: ProductSchema,
    qty: z.number().int().positive().max(10000)
}).strict();

const ensureUniqueIds = (items) => {
    const ids = items.map(i => i.id || (i.product && i.product.id));
    return new Set(ids).size === ids.length;
};

const RecommendRequestSchema = z.object({
    cart: z.array(CartItemSchema).max(50).refine(ensureUniqueIds, "IDs duplicados en carrito"),
    inventory: z.array(ProductSchema).max(200).refine(ensureUniqueIds, "IDs duplicados en inventario")
}).strict();

export function createApp({ checkAiQuota, createGenerativeModel }) {
    const app = express();
    app.use(helmet());
    app.disable('x-powered-by');

    const trustProxyEnv = process.env.TRUST_PROXY;
    if (trustProxyEnv) {
        app.set('trust proxy', isNaN(Number(trustProxyEnv)) ? trustProxyEnv : Number(trustProxyEnv));
    }

    const globalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100, 
        message: { error: 'Demasiadas solicitudes, intente más tarde.', fallback: true },
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(globalLimiter);

    const aiLimiter = rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 10,
        message: { error: 'Límite de IA excedido, use fallback.', fallback: true }
    });

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080')
        .split(',')
        .map(o => o.trim())
        .filter(o => o.length > 0);

    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('CORS_REJECTED'));
            }
        },
        optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions));
    app.use(express.json({ limit: '100kb' })); 

    app.post('/api/recommend', aiLimiter, async (req, res) => {
        try {
            const parsed = RecommendRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: 'Payload malformado', issues: parsed.error.issues });
            }

            const { cart, inventory } = parsed.data;
            if (cart.length === 0 || inventory.length === 0) {
                return res.json({ recommendations: [] });
            }

            const inventoryIds = new Set(inventory.map(p => p.id));
            const invalidCartItems = cart.filter(item => !inventoryIds.has(item.product.id));
            if (invalidCartItems.length > 0) {
                 return res.status(400).json({ error: 'Inconsistencia: Productos del carrito no existen en inventario' });
            }

            if (!tryAcquireAiSlot()) {
                return res.status(429).json({ error: 'Servidor ocupado (Concurrencia máxima)', fallback: true });
            }

            try {
                const hasQuota = await checkAiQuota();
                if (!hasQuota) {
                    throw new Error("QUOTA_EXCEEDED");
                }

                const cartData = cart.map(item => ({ id: item.product.id, qty: item.qty, name: item.product.name }));
                const inventoryData = inventory.map(p => ({ id: p.id, name: p.name, category: p.category }));

                const prompt = buildRecommendationPrompt(cartData, inventoryData);
                
                const model = createGenerativeModel();
                const result = await model.generateContent(prompt);
                
                const responseText = result.response.text();
                let aiRecommendations = [];
                try {
                    aiRecommendations = JSON.parse(responseText);
                } catch (e) {
                    throw new Error("INVALID_JSON");
                }

                const LlmOutputSchema = z.array(z.string()).max(5);
                const outputParsed = LlmOutputSchema.safeParse(aiRecommendations);
                
                if (!outputParsed.success) throw new Error("INVALID_SCHEMA");

                const cartIds = new Set(cart.map(i => i.product.id));
                const safeRecommendations = [...new Set(
                    outputParsed.data.filter(id => inventoryIds.has(id) && !cartIds.has(id))
                )].slice(0, 2);

                res.json({ recommendations: safeRecommendations });

            } finally {
                releaseAiSlot();
            }
            
        } catch (error) {
            if (error.message === 'QUOTA_EXCEEDED') {
                console.error('[AI_QUOTA] Cuota agotada.');
            } else if (error.message && error.message.includes('timeout')) {
                console.error('[AI_TIMEOUT] Gemini excedió el límite.');
            } else if (error.message === 'INVALID_JSON' || error.message === 'INVALID_SCHEMA') {
                console.error('[AI_INVALID_RESPONSE] Gemini devolvió un formato no válido.');
            } else if (error.message && error.message.includes('fetch')) {
                 console.error('[AI_NETWORK_ERROR] Error de red contactando a Gemini.');
            } else {
                 console.error('[SERVER_ERROR] Ocurrió una excepción interna.');
            }
            res.status(503).json({ error: 'Servicio no disponible temporalmente', fallback: true });
        }
    });

    app.use((err, req, res, next) => {
        if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
            return res.status(400).json({ error: 'Sintaxis JSON malformada' });
        }
        if (err.message === 'CORS_REJECTED') {
            return res.status(403).json({ error: 'Origen no autorizado' });
        }
        if (err.type === 'entity.too.large') {
            return res.status(413).json({ error: 'Payload demasiado grande' });
        }
        res.status(500).json({ error: 'Error del servidor' });
    });

    return app;
}
