import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createApp } from './src/app.js';

dotenv.config();

if (process.env.NODE_ENV !== 'test') {
    // La política elegida exige una clave real tanto en producción como en desarrollo, 
    // ya que el entorno de desarrollo realiza peticiones auténticas a Gemini.
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
        throw new Error("FATAL: GEMINI_API_KEY missing or invalid.");
    }

    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (process.env.NODE_ENV === 'production') {
        // Producción: Configuración obligatoria y estricta de orígenes.
        if (!envOrigins || envOrigins.includes('*')) {
            throw new Error("FATAL: ALLOWED_ORIGINS missing or contains '*' in production.");
        }
    }

    if (!process.env.TRUST_PROXY) {
        console.warn("WARNING: TRUST_PROXY no configurado. Verifique esta opción según la topología de despliegue; una configuración incorrecta puede compartir límites entre usuarios o confiar en IPs falsificadas.");
    }
}

// Stub function for AI Quota check.
// No ofrece protección económica real en este entorno (NO IMPLEMENTADO).
export async function checkAiQuota() {
    return true;
}

export function createGenerativeModel() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel(
        { 
            model: "gemini-1.5-flash-latest",
            generationConfig: { responseMimeType: "application/json", maxOutputTokens: 100 }
        },
        { timeout: 8000 } 
    );
}

const app = createApp({ checkAiQuota, createGenerativeModel });

export default app;

if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Servidor Seguro corriendo en http://localhost:${PORT}`);
    });
}
