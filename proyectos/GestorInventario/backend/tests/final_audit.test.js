import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import nock from 'nock';
import { createApp, resetConcurrentAiRequests, tryAcquireAiSlot, releaseAiSlot } from '../src/app.js';
import { buildRecommendationPrompt } from '../src/promptBuilder.js';

process.env.NODE_ENV = 'test';
process.env.TRUST_PROXY = '1';
process.env.ALLOWED_ORIGINS = 'http://localhost:8080';

nock.disableNetConnect();
nock.enableNetConnect(/^(?:localhost|127\.0\.0\.1|::1)(?::\d+)?$/);

test.afterEach(async () => {
    assert.strictEqual(nock.pendingMocks().length, 0, "No deben quedar interceptores pendientes");
    const mod = await import('../src/app.js');
    assert.strictEqual(mod.currentConcurrentAiRequests, 0, "Fuga de concurrencia detectada (el slot no se liberó)");
    nock.cleanAll();
    resetConcurrentAiRequests();
});

test('BLOQUEO HTTP/HTTPS Y RED CON NOCK', async (t) => {
    await t.test('Intento deliberado de conexión externa bloqueado', async () => {

        let threw = false;
        try {
            await fetch('https://google.com');
        } catch (e) {
            threw = true;
        }
        assert.ok(threw, "Debe lanzar error al intentar conexión externa (fetch)");
    });
});

test('SEGURIDAD Y RED (CORS y Rate Limit)', async (t) => {
    const app = createApp({
        checkAiQuota: async () => true,
        createGenerativeModel: () => ({ generateContent: async () => ({ response: { text: () => '["P1"]' } }) })
    });

    await t.test('Origen CORS permitido', async () => {
        const res = await request(app).options('/api/recommend').set('Origin', 'http://localhost:8080');
        assert.strictEqual(res.status, 200);
    });

    await t.test('Origen CORS rechazado', async () => {
        const res = await request(app).post('/api/recommend').set('Origin', 'http://malicioso.com');
        assert.strictEqual(res.status, 403);
    });

    await t.test('Solicitud sin Origin (Same-origin)', async () => {
        const res = await request(app).post('/api/recommend').send({ cart: [], inventory: [] });
        assert.strictEqual(res.status, 200); 
    });

    await t.test('Rate limit por IP (100 global, 10 AI)', async () => {
        // Enviar 11 peticiones a la API para agotar el rate limit de AI Limit
        let rejected = false;
        for (let i = 0; i < 11; i++) {
            const res = await request(app).post('/api/recommend')
                .send({ cart: [], inventory: [] })
                .set('X-Forwarded-For', '99.99.99.99');
            if (res.status === 429) {
                rejected = true;
            }
        }
        assert.ok(rejected, "La solicitud 11 debe ser bloqueada por rate limit");
    });
});

test('VALIDACIÓN DE ENTRADAS', async (t) => {
    const app = createApp({
        checkAiQuota: async () => true,
        createGenerativeModel: () => ({ generateContent: async () => ({ response: { text: () => '["P1"]' } }) })
    });

    const sendInvalid = async (payload) => request(app).post('/api/recommend').send(payload);

    await t.test('JSON sintácticamente malformado', async () => {
        const res = await request(app).post('/api/recommend')
            .set('Content-Type', 'application/json')
            .send('{"cart": [} malformed');
        assert.strictEqual(res.status, 400);
        assert.ok(res.body.error.includes("malformada"));
    });

    await t.test('Content-Type incorrecto (text/plain)', async () => {
        const res = await request(app).post('/api/recommend')
            .set('Content-Type', 'text/plain')
            .send('{"cart": [], "inventory": []}');
        // Dependiendo de si la capa rechaza explícitamente o Zod asume payload vacío, será 415 o 400.
        // Dado el stack actual (Zod falla en el parseo por req.body vacío), se espera 400.
        assert.strictEqual(res.status, 400);
    });

    await t.test('JSON válido con tipos incorrectos', async () => {
        const res = await sendInvalid({ cart: "no-array", inventory: [] });
        assert.strictEqual(res.status, 400);
    });

    await t.test('Body vacío', async () => {
        const res = await sendInvalid({});
        assert.strictEqual(res.status, 400);
    });

    await t.test('Payload superior a 100 KB', async () => {
        const bigString = "a".repeat(150000); // 150kb
        const res = await request(app).post('/api/recommend')
            .set('Content-Type', 'application/json')
            .send(`{"cart":[], "inventory":[], "junk": "${bigString}"}`);
        assert.strictEqual(res.status, 413);
    });

    await t.test('Arrays superiores al máximo', async () => {
        const cart = Array(51).fill({ product: { id: "P1", name: "A", category: "C", price: 1, stock: 1 }, qty: 1 });
        const res = await sendInvalid({ cart, inventory: [] });
        assert.strictEqual(res.status, 400);
    });

    await t.test('Propiedades adicionales (strict mode)', async () => {
        const res = await sendInvalid({
            cart: [{ product: { id: "P1", name: "A", category: "C", price: 1, stock: 1, extra: "invalid" }, qty: 1 }],
            inventory: []
        });
        assert.strictEqual(res.status, 400);
    });

    await t.test('Strings vacíos', async () => {
        const res = await sendInvalid({
            cart: [],
            inventory: [{ id: "   ", name: "A", category: "C", price: 1, stock: 1 }]
        });
        assert.strictEqual(res.status, 400);
    });

    await t.test('IDs duplicados', async () => {
        const res = await sendInvalid({
            cart: [],
            inventory: [
                { id: "P1", name: "A", category: "C", price: 1, stock: 1 },
                { id: "P1", name: "B", category: "C", price: 1, stock: 1 }
            ]
        });
        assert.strictEqual(res.status, 400);
    });

    await t.test('Producto del carrito inexistente en inventario', async () => {
        const res = await sendInvalid({
            cart: [{ product: { id: "P999", name: "Fantasma", category: "C", price: 1, stock: 1 }, qty: 1 }],
            inventory: [{ id: "P1", name: "A", category: "C", price: 1, stock: 1 }]
        });
        assert.strictEqual(res.status, 400);
        assert.ok(res.body.error.includes("Inconsistencia"));
    });
});

test('GEMINI Y LÓGICA DE NEGOCIO', async (t) => {
    const defaultPayload = {
        cart: [{ product: { id: "P1", name: "A", category: "C", price: 1, stock: 1 }, qty: 1 }],
        inventory: [
            { id: "P1", name: "A", category: "C", price: 1, stock: 1 },
            { id: "P2", name: "B", category: "D", price: 2, stock: 2 }
        ]
    };

    await t.test('Verificar Configuración Productiva de Gemini (Timeout y Modelo)', async (t) => {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const { createGenerativeModel } = await import('../server.js');
        
        let calledArgs = null;
        t.mock.method(GoogleGenerativeAI.prototype, 'getGenerativeModel', (...args) => {
            calledArgs = args;
            return {}; 
        });

        createGenerativeModel();
        
        assert.ok(calledArgs !== null, "getGenerativeModel debe ser invocado");
        assert.strictEqual(calledArgs.length, 2, "getGenerativeModel debe recibir exactamente 2 argumentos");
        
        assert.deepStrictEqual(calledArgs[0], {
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 100
            }
        });
        assert.deepStrictEqual(calledArgs[1], { timeout: 8000 });
    });

    await t.test('Timeout procesado y Prompt estructurado', async () => {
        let capturedPrompt = null;
        let timeoutTriggered = false;

        const app = createApp({
            checkAiQuota: async () => true,
            createGenerativeModel: () => ({
                generateContent: async (prompt) => {
                    capturedPrompt = prompt;
                    timeoutTriggered = true;
                    throw new Error("timeout excedido");
                }
            })
        });

        const res = await request(app).post('/api/recommend').send(defaultPayload);
        assert.strictEqual(res.status, 503);
        assert.strictEqual(timeoutTriggered, true);
        
        assert.ok(capturedPrompt.includes('<<<CART_DATA'));
        assert.ok(capturedPrompt.includes('<<<INVENTORY_DATA'));
        assert.ok(!capturedPrompt.includes('AIzaSy'));
    });

    await t.test('Error de red', async () => {
        const app = createApp({
            checkAiQuota: async () => true,
            createGenerativeModel: () => ({
                generateContent: async () => { throw new Error("fetch failed"); }
            })
        });
        const res = await request(app).post('/api/recommend').send(defaultPayload);
        assert.strictEqual(res.status, 503);
    });

    await t.test('JSON inválido o Esquema de salida inválido', async () => {
        const appInvalid = createApp({
            checkAiQuota: async () => true,
            createGenerativeModel: () => ({ generateContent: async () => ({ response: { text: () => 'NOT_JSON' } }) })
        });
        const res1 = await request(appInvalid).post('/api/recommend').send(defaultPayload);
        assert.strictEqual(res1.status, 503);

        const appSchema = createApp({
            checkAiQuota: async () => true,
            createGenerativeModel: () => ({ generateContent: async () => ({ response: { text: () => '{"wrong": 1}' } }) })
        });
        const res2 = await request(appSchema).post('/api/recommend').send(defaultPayload);
        assert.strictEqual(res2.status, 503);
    });

    await t.test('Deduplicación, IDs inventados y Exclusión de productos en carrito', async () => {
        const app = createApp({
            checkAiQuota: async () => true,
            createGenerativeModel: () => ({
                generateContent: async () => ({ response: { text: () => '["P2", "P2", "INVENTADO123", "P1"]' } })
            })
        });
        const res = await request(app).post('/api/recommend').send(defaultPayload);
        assert.strictEqual(res.status, 200);
        // Debe filtrar: 
        // P2 (duplicado -> se queda una vez)
        // INVENTADO123 (no existe)
        // P1 (ya está en el carrito)
        assert.deepStrictEqual(res.body.recommendations, ["P2"]);
    });
});

test('CONCURRENCIA Y CUOTA (RELEASEAISLOT)', async (t) => {
    const defaultPayload = {
        cart: [{ product: { id: "P1", name: "A", category: "C", price: 1, stock: 1 }, qty: 1 }],
        inventory: [{ id: "P1", name: "A", category: "C", price: 1, stock: 1 }]
    };

    await t.test('Corregir releaseAiSlot: lanzar si el contador baja de cero', async () => {
        resetConcurrentAiRequests();
        let threw = false;
        try {
            releaseAiSlot();
        } catch(e) {
            threw = true;
            assert.strictEqual(e.message, 'FATAL_CONCURRENCY_NEGATIVE');
        }
        assert.ok(threw);
    });

    await t.test('Seis solicitudes simultáneas (Retención sincrónica)', async () => {
        resetConcurrentAiRequests();
        let resolvers = [];
        const app = createApp({
            checkAiQuota: async () => {
                await new Promise(r => resolvers.push(r));
                return true;
            },
            createGenerativeModel: () => ({ generateContent: async () => ({ response: { text: () => '["P1"]' } }) })
        });

        const reqs = [];
        for(let i=0; i<6; i++) {
            reqs.push(request(app).post('/api/recommend').set('X-Forwarded-For', `70.0.0.${i}`).send(defaultPayload).then(x=>x));
        }
        
        await new Promise(r => setTimeout(r, 200));

        let currentCon = 0;
        let maxCon = 0;
        try {
            const mod = await import('../src/app.js');
            currentCon = mod.currentConcurrentAiRequests;
            maxCon = mod.maxObservedConcurrency;
            assert.strictEqual(currentCon, 5);
        } finally {
            resolvers.forEach(r => r());
        }

        const res = await Promise.all(reqs);
        const ok = res.filter(r => r.status === 200);
        const rate = res.filter(r => r.status === 429);
        assert.strictEqual(ok.length, 5);
        assert.strictEqual(rate.length, 1);
        assert.strictEqual(maxCon, 5);
    });

    await t.test('Veinte solicitudes simultáneas', async () => {
        resetConcurrentAiRequests();
        const app = createApp({
            checkAiQuota: async () => true,
            createGenerativeModel: () => ({ generateContent: async () => {
                await new Promise(r => setTimeout(r, 50));
                return { response: { text: () => '["P1"]' } };
            }})
        });

        const reqs = [];
        for(let i=0; i<20; i++) {
            reqs.push(request(app).post('/api/recommend').set('X-Forwarded-For', `80.0.0.${i}`).send(defaultPayload).then(x=>x));
        }

        const res = await Promise.all(reqs);
        const ok = res.filter(r => r.status === 200);
        const rate = res.filter(r => r.status === 429);
        assert.strictEqual(ok.length, 5);
        assert.strictEqual(rate.length, 15);
        
        const mod = await import('../src/app.js');
        assert.strictEqual(mod.currentConcurrentAiRequests, 0);
    });

    await t.test('Cuota agotada', async () => {
        let genAiCalled = false;
        const app = createApp({ 
            checkAiQuota: async () => false, 
            createGenerativeModel: () => { genAiCalled = true; } 
        });
        const res = await request(app).post('/api/recommend').send(defaultPayload);
        assert.strictEqual(res.status, 503);
        assert.strictEqual(genAiCalled, false, "El modelo no debió inicializarse si la cuota está agotada");
    });

    await t.test('Error del almacenamiento de cuota', async () => {
        let genAiCalled = false;
        const app = createApp({ 
            checkAiQuota: async () => { throw new Error("DB fail"); }, 
            createGenerativeModel: () => { genAiCalled = true; } 
        });
        const res = await request(app).post('/api/recommend').send(defaultPayload);
        assert.strictEqual(res.status, 503);
        assert.strictEqual(genAiCalled, false, "El modelo no debió inicializarse ante error de DB");
    });
});
