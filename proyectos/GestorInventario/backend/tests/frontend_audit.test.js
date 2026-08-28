import test from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, '../../index.html');
const jsPath = path.resolve(__dirname, '../../script.js');

const html = fs.readFileSync(htmlPath, 'utf-8');
const js = fs.readFileSync(jsPath, 'utf-8');

function setupDom() {
    const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost:8080/" });
    dom.window.bootstrap = { Modal: class { show(){} hide(){} }, Toast: class { show(){} hide(){} } };
    return dom;
}

test('FRONTEND', async (t) => {
    
    await t.test('XSS', async () => {
        const dom = setupDom();
        const maliciousPayload = `<img src="x" onerror="window.XSS_EXECUTED=true" id="xss-proof">`;
        
        dom.window.localStorage.setItem('pos_products', JSON.stringify([
            { id: 'P001', barcode: '123', name: maliciousPayload, category: 'Snacks', price: 10, stock: 5 },
            { id: 'P002', name: 'Dummy', category: 'Otros', price: 1, stock: 1 }
        ]));

        const scriptEl = dom.window.document.createElement('script');
        scriptEl.textContent = js;
        dom.window.document.body.appendChild(scriptEl);

        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
        
        await new Promise(r => setTimeout(r, 100));

        const tbody = dom.window.document.getElementById('inventory-tbody');
        const xssProof = dom.window.document.getElementById('xss-proof');
        
        assert.strictEqual(xssProof, null, "El payload no debió ser inyectado como elemento HTML");
        assert.ok(!tbody.innerHTML.includes('<img src="x"'), "El payload malicioso debió ser sanitizado o escapado");
    });

    await t.test('Flujo Normal: Recepción de recomendaciones válidas', async () => {
        const dom = setupDom();
        dom.window.fetch = async () => ({ ok: true, json: async () => ({ recommendations: ["P002"] }) });

        const scriptEl = dom.window.document.createElement('script');
        scriptEl.textContent = js;
        dom.window.document.body.appendChild(scriptEl);

        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
        await new Promise(r => setTimeout(r, 100));

        const products = JSON.parse(dom.window.localStorage.getItem('pos_products'));
        dom.window.addToCart(products[0].id);
        dom.window.updateCartQty(products[0].id, 1);
        await new Promise(r => setTimeout(r, 500)); // Esperar debounce y fetch
        
        const aiCard = dom.window.document.getElementById('ai-assistant-card');
        assert.ok(aiCard.style.display !== 'none');
        const list = dom.window.document.getElementById('ai-recommendations');
        assert.ok(list.innerHTML.includes('Sprite 2L'), "Debe renderizar el nombre del producto recomendado");
    });

    await t.test('Fallback: Backend responde 503 con fallback: true', async () => {
        const dom = setupDom();
        dom.window.fetch = async () => ({ ok: false, status: 503, json: async () => ({ error: "busy", fallback: true }) });

        const scriptEl = dom.window.document.createElement('script');
        scriptEl.textContent = js;
        dom.window.document.body.appendChild(scriptEl);

        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
        await new Promise(r => setTimeout(r, 100));

        const products = JSON.parse(dom.window.localStorage.getItem('pos_products'));
        dom.window.addToCart(products[1].id);
        dom.window.updateCartQty(products[1].id, 1);
        await new Promise(r => setTimeout(r, 500)); 
        
        const aiCard = dom.window.document.getElementById('ai-assistant-card');
        assert.ok(aiCard.style.display !== 'none', "La UI no debe romperse y debe mostrar recomendaciones locales");
    });

    await t.test('Fallback: Fetch arroja error de red', async () => {
        const dom = setupDom();
        dom.window.fetch = async () => { throw new TypeError("Failed to fetch"); };

        const scriptEl = dom.window.document.createElement('script');
        scriptEl.textContent = js;
        dom.window.document.body.appendChild(scriptEl);

        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
        await new Promise(r => setTimeout(r, 100));

        const products = JSON.parse(dom.window.localStorage.getItem('pos_products'));
        dom.window.addToCart(products[2].id);
        dom.window.updateCartQty(products[2].id, 1);
        await new Promise(r => setTimeout(r, 500)); 
        
        const aiCard = dom.window.document.getElementById('ai-assistant-card');
        assert.ok(aiCard.style.display !== 'none', "La UI no debe romperse ante error de red");
    });

    await t.test('Fallback: Backend devuelve JSON inválido', async () => {
        const dom = setupDom();
        dom.window.fetch = async () => ({ ok: true, json: async () => { throw new Error("Unexpected token"); } });

        const scriptEl = dom.window.document.createElement('script');
        scriptEl.textContent = js;
        dom.window.document.body.appendChild(scriptEl);

        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
        await new Promise(r => setTimeout(r, 100));

        const products = JSON.parse(dom.window.localStorage.getItem('pos_products'));
        dom.window.addToCart(products[3].id);
        dom.window.updateCartQty(products[3].id, 1);
        await new Promise(r => setTimeout(r, 500)); 
        
        const aiCard = dom.window.document.getElementById('ai-assistant-card');
        assert.ok(aiCard.style.display !== 'none', "La UI no debe romperse ante JSON inválido");
    });
});
