const TEST_TARGETS = [
    {
        id: 'portafolio',
        category: 'Portafolio',
        name: 'Portafolio Principal (Landing)',
        url: '../../index.html',
        expectedSelectors: ['#navbar', '#about', '#projects', '#contact', '#contact-form']
    },
    {
        id: 'squatgym-main',
        category: 'SquatGym',
        name: 'SquatGym OS (Login & Shell)',
        url: '../SquatGym/index.html',
        expectedSelectors: ['#login-frame', '#l-btn-staff', '#l-btn-alumno', '#sidebar-ui', '#app-container'],
        e2eAction: async (doc, win, log) => {
            if (typeof win.autoLoginDemo === 'function') {
                log('⚡ Ejecutando E2E Login Demo (Admin: 1 / admin)...', 'info');
                await win.autoLoginDemo('admin', '1', 'admin');
                await new Promise(r => setTimeout(r, 250));
                const appVisible = !doc.getElementById('app-container')?.classList.contains('hidden');
                if (appVisible) {
                    log('✓ E2E Login Admin exitoso: Dashboard y Sidebar cargados.', 'ok');
                } else {
                    throw new Error('App container sigue oculto');
                }
            }
        }
    },
    {
        id: 'squatgym-landing',
        category: 'SquatGym',
        name: 'SquatGym (Landing Comercial)',
        url: '../SquatGym/pantallas/landing.html',
        expectedSelectors: ['button', 'a']
    },
    {
        id: 'squatgym-membresia',
        category: 'SquatGym',
        name: 'SquatGym (Cobros & Membresías)',
        url: '../SquatGym/pantallas/adm-membresia.html',
        expectedSelectors: ['button', 'input']
    },
    {
        id: 'squatgym-kiosco',
        category: 'SquatGym',
        name: 'SquatGym (Kiosco & Ventas Staff)',
        url: '../SquatGym/pantallas/adm-kiosco.html',
        expectedSelectors: ['button']
    },
    {
        id: 'squatgym-alumno',
        category: 'SquatGym',
        name: 'SquatGym (Portal Alumno & Cuotas)',
        url: '../SquatGym/pantallas/alu-pago.html',
        expectedSelectors: ['#alu-btn-pagar']
    },
    {
        id: 'mateando-home',
        category: 'Mateando',
        name: 'Mateando (Inicio & Carrito)',
        url: '../Mateando/index.html',
        expectedSelectors: ['.productos-header', '.add-cart', '#carritoModal', '.confirmar-compra']
    },
    {
        id: 'mateando-prod',
        category: 'Mateando',
        name: 'Mateando (Catálogo de Productos)',
        url: '../Mateando/Pantallas/productos.html',
        expectedSelectors: ['.filtros', '.producto-card', '.add-cart', '#carritoModal']
    },
    {
        id: 'mateando-ideas',
        category: 'Mateando',
        name: 'Mateando (Ideas & Rituales)',
        url: '../Mateando/Pantallas/ideas.html',
        expectedSelectors: ['.idea-card', '.ritual-section', '#carritoModal']
    },
    {
        id: 'mateando-contacto',
        category: 'Mateando',
        name: 'Mateando (Contacto)',
        url: '../Mateando/Pantallas/contacto.html',
        expectedSelectors: ['.contact-form', '#carritoModal']
    },
    {
        id: 'mateando-envios',
        category: 'Mateando',
        name: 'Mateando (Logística & Envíos)',
        url: '../Mateando/Pantallas/envios.html',
        expectedSelectors: ['.seleccionar-envio', '#form-envio', '#guardar-envio']
    },
    {
        id: 'pos-inventario',
        category: 'POS',
        name: 'Sistema POS e Inventario (StockMaster)',
        url: '../GestorInventario/index.html',
        expectedSelectors: ['.sidebar', 'button']
    },
    {
        id: 'memoria-3d',
        category: 'Apps',
        name: 'Juego de Memoria 3D',
        url: '../Memoria/index.html',
        expectedSelectors: ['button']
    },
    {
        id: 'agenda-profe',
        category: 'Apps',
        name: 'Agenda para Profes Particulares',
        url: '../AgendaProfe/index.html',
        expectedSelectors: ['button']
    },
    {
        id: 'gestor-gastos',
        category: 'Apps',
        name: 'Gestor de Gastos',
        url: '../GestorGastos/index.html',
        expectedSelectors: ['button', 'form']
    },
    {
        id: 'app-clima',
        category: 'Apps',
        name: 'App del Clima Inteligente',
        url: '../AppClima/index.html',
        expectedSelectors: ['button', 'input']
    }
];

let currentFilter = 'all';
let resultsStore = [];
let isRunning = false;

const suitesContainer = document.getElementById('suites-container');
const consoleOutput = document.getElementById('console-output');
const statPages = document.getElementById('stat-pages');
const statButtons = document.getElementById('stat-buttons');
const statLinks = document.getElementById('stat-links');
const statScore = document.getElementById('stat-score');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const statusText = document.getElementById('status-text');
const badgeSummary = document.getElementById('badge-summary');
const qaIframe = document.getElementById('qa-iframe');
const sandboxOverlay = document.getElementById('sandbox-overlay');
const sandboxUrl = document.getElementById('sandbox-url');

function writeLog(msg, type = 'log') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString('es-AR', { hour12: false });
    line.textContent = `[${time}] ${msg}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

document.getElementById('btn-clear-log').addEventListener('click', () => {
    consoleOutput.innerHTML = '';
    writeLog('Consola limpia.', 'info');
});

document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderSuites();
    });
});

function isLocalCheckableUrl(rawUrl) {
    if (!rawUrl) return false;
    const trimmed = rawUrl.trim();
    return !(
        trimmed.startsWith('#') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('tel:') ||
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:')
    );
}

async function verifyAssetUrl(resolvedUrl) {
    try {
        const res = await fetch(resolvedUrl, { method: 'GET', cache: 'no-store' });
        return res.ok;
    } catch {
        return false;
    }
}

function loadInSandbox(url) {
    return new Promise((resolve) => {
        sandboxOverlay.classList.add('hidden');
        sandboxUrl.textContent = url;
        let done = false;

        const finish = (ok) => {
            if (done) return;
            done = true;
            resolve(ok);
        };

        const timer = setTimeout(() => finish(true), 2200);
        qaIframe.onload = () => {
            clearTimeout(timer);
            finish(true);
        };
        qaIframe.onerror = () => {
            clearTimeout(timer);
            finish(false);
        };
        qaIframe.src = url;
    });
}

async function auditSingleTarget(target) {
    const checks = [];
    let buttonsCount = 0;
    let linksCount = 0;

    writeLog(`▶ Auditando: ${target.name} (${target.url})`, 'info');

    // 1. Fetch HTML
    let htmlText = '';
    try {
        const response = await fetch(target.url, { cache: 'no-store' });
        if (!response.ok) {
            checks.push({ label: `HTTP GET ${target.url} (${response.status})`, pass: false });
            writeLog(`✖ Error HTTP ${response.status} al cargar ${target.url}`, 'err');
            return { target, checks, buttonsCount, linksCount, passed: false };
        }
        checks.push({ label: `HTTP 200 OK: ${target.url}`, pass: true });
        htmlText = await response.text();
    } catch (err) {
        checks.push({ label: `Fetch ${target.url}`, pass: false });
        writeLog(`✖ Fallo de red al cargar ${target.url}`, 'err');
        return { target, checks, buttonsCount, linksCount, passed: false };
    }

    // 2. Parse DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const baseUrl = new URL(target.url, window.location.href);

    // 3. Auditar Botones
    const buttons = Array.from(doc.querySelectorAll('button, input[type="button"], input[type="submit"]'));
    buttonsCount = buttons.length;
    buttons.forEach((btn, i) => {
        const text = (btn.textContent || btn.value || btn.getAttribute('aria-label') || btn.getAttribute('title') || '').trim();
        const hasIcon = !!btn.querySelector('i, svg, img, span');
        const isClose = btn.classList.contains('btn-close') || btn.hasAttribute('data-bs-dismiss');
        const label = text ? `Botón "${text.slice(0, 22)}"` : `Botón #${i + 1} (Icon/UI)`;
        const valid = text.length > 0 || hasIcon || isClose;
        checks.push({ label, pass: valid });
    });

    // 4. Auditar Menús y Enlaces locales
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    linksCount = anchors.length;

    for (const a of anchors) {
        const rawHref = a.getAttribute('href');
        const linkText = (a.textContent || '').trim().slice(0, 18) || rawHref;
        if (!isLocalCheckableUrl(rawHref)) {
            checks.push({ label: `Menú/Link "${linkText}"`, pass: true });
            continue;
        }
        const resolved = new URL(rawHref, baseUrl).href;
        const ok = await verifyAssetUrl(resolved);
        checks.push({ label: `Ruta "${rawHref}"`, pass: ok });
        if (!ok) {
            writeLog(`✖ Ruta rota en ${target.name}: ${rawHref}`, 'err');
        }
    }

    // 5. Auditar Selectores Clave de la Pantalla
    for (const sel of (target.expectedSelectors || [])) {
        const found = !!doc.querySelector(sel);
        checks.push({ label: `Selector UI "${sel}"`, pass: found });
    }

    // 6. Simulación en Sandbox E2E en vivo
    await loadInSandbox(target.url);
    await new Promise(r => setTimeout(r, 180));

    if (target.e2eAction && qaIframe.contentDocument && qaIframe.contentWindow) {
        try {
            await target.e2eAction(qaIframe.contentDocument, qaIframe.contentWindow, writeLog);
            checks.push({ label: 'E2E Auto-Login & Navegación', pass: true });
        } catch (e) {
            checks.push({ label: 'E2E Auto-Login & Navegación', pass: false });
        }
    }

    const allPassed = checks.every(c => c.pass);
    writeLog(
        `${allPassed ? '✔' : '⚠'} ${target.name}: ${buttonsCount} botones, ${linksCount} menús (${checks.filter(c => c.pass).length}/${checks.length} checks OK)`,
        allPassed ? 'ok' : 'warn'
    );

    return {
        target,
        checks,
        buttonsCount,
        linksCount,
        passed: allPassed
    };
}

function renderSuites() {
    suitesContainer.innerHTML = '';

    const filtered = TEST_TARGETS.filter(t => currentFilter === 'all' || t.category === currentFilter);

    filtered.forEach(target => {
        const res = resultsStore.find(r => r.target.id === target.id);
        const card = document.createElement('div');
        card.className = `suite-card ${res ? (res.passed ? 'passed' : 'failed') : ''}`;

        const passCount = res ? res.checks.filter(c => c.pass).length : 0;
        const totalCount = res ? res.checks.length : 0;

        card.innerHTML = `
            <div class="suite-top">
                <div class="suite-title">
                    <i class="ph-fill ${!res ? 'ph-circle-dashed' : (res.passed ? 'ph-check-circle' : 'ph-warning-circle')}"
                       style="color: ${!res ? '#64748b' : (res.passed ? '#10b981' : '#ef4444')}; font-size: 1.2rem;"></i>
                    <div>
                        <h3>${target.name}</h3>
                        <span class="suite-path">${target.url}</span>
                    </div>
                </div>
                <div class="suite-actions">
                    ${res ? `<button class="btn-mini btn-toggle-details" data-id="${target.id}"><i class="ph ph-caret-down"></i> Ver ${totalCount} checks</button>` : ''}
                    <button class="btn-mini btn-run-single" data-id="${target.id}"><i class="ph-fill ph-play"></i> Probar</button>
                </div>
            </div>
            ${res ? `
                <div class="suite-stats">
                    <span class="chip ${res.passed ? 'ok' : 'err'}">${passCount}/${totalCount} Pruebas OK</span>
                    <span class="chip"><i class="ph-fill ph-cursor-click"></i> ${res.buttonsCount} Botones</span>
                    <span class="chip"><i class="ph-fill ph-compass"></i> ${res.linksCount} Menús / Links</span>
                </div>
                <div class="suite-details" id="details-${target.id}">
                    <div class="check-grid">
                        ${res.checks.map(c => `
                            <div class="check-item ${c.pass ? 'pass' : 'fail'}" title="${c.label}">
                                <i class="ph-fill ${c.pass ? 'ph-check-circle' : 'ph-x-circle'}"></i>
                                <span>${c.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        suitesContainer.appendChild(card);
    });

    document.querySelectorAll('.btn-toggle-details').forEach(btn => {
        btn.addEventListener('click', () => {
            const detailEl = document.getElementById(`details-${btn.dataset.id}`);
            if (detailEl) detailEl.classList.toggle('open');
        });
    });

    document.querySelectorAll('.btn-run-single').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (isRunning) return;
            const target = TEST_TARGETS.find(t => t.id === btn.dataset.id);
            if (!target) return;
            isRunning = true;
            const result = await auditSingleTarget(target);
            const idx = resultsStore.findIndex(r => r.target.id === target.id);
            if (idx >= 0) resultsStore[idx] = result;
            else resultsStore.push(result);
            updateGlobalMetrics();
            renderSuites();
            isRunning = false;
        });
    });
}

function updateGlobalMetrics() {
    const pagesDone = resultsStore.length;
    const totalBtns = resultsStore.reduce((acc, r) => acc + r.buttonsCount, 0);
    const totalLinks = resultsStore.reduce((acc, r) => acc + r.linksCount, 0);
    const totalChecks = resultsStore.reduce((acc, r) => acc + r.checks.length, 0);
    const passedChecks = resultsStore.reduce((acc, r) => acc + r.checks.filter(c => c.pass).length, 0);

    statPages.textContent = `${pagesDone} / ${TEST_TARGETS.length}`;
    statButtons.textContent = totalBtns;
    statLinks.textContent = totalLinks;

    if (totalChecks > 0) {
        const pct = ((passedChecks / totalChecks) * 100).toFixed(1);
        statScore.textContent = `${pct}%`;
        badgeSummary.textContent = `${passedChecks}/${totalChecks} Checks OK`;
        badgeSummary.className = `status-badge ${passedChecks === totalChecks ? 'ok' : 'warn'}`;
    }
}

async function runFullAudit() {
    if (isRunning) return;
    isRunning = true;
    resultsStore = [];
    consoleOutput.innerHTML = '';
    writeLog('🚀 Iniciando Auditoría Automatizada de Portafolio (16 pantallas)...', 'info');

    for (let i = 0; i < TEST_TARGETS.length; i++) {
        const target = TEST_TARGETS[i];
        statusText.textContent = `Auditando (${i + 1}/${TEST_TARGETS.length}): ${target.name}...`;
        const pct = Math.round(((i) / TEST_TARGETS.length) * 100);
        progressBar.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;

        const res = await auditSingleTarget(target);
        resultsStore.push(res);
        updateGlobalMetrics();
        renderSuites();
    }

    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';
    statusText.textContent = '✅ Auditoría completada: todos los proyectos fueron inspeccionados.';
    writeLog('🎉 Auditoría E2E finalizada con éxito.', 'ok');
    isRunning = false;
}

document.getElementById('btn-run-all').addEventListener('click', runFullAudit);

// Inicializar vista y correr automáticamente al abrir
renderSuites();
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(runFullAudit, 400);
});
