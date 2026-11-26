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
        expectedSelectors: ['button', 'input', '#paginacion-socios']
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

let currentMode = 'custom'; // 'custom' | 'portfolio'
let currentFilter = 'all';
let resultsStore = [];
let customResultsStore = [];
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
const customUploaderPanel = document.getElementById('custom-uploader-panel');
const portfolioFilters = document.getElementById('portfolio-filters');
const textareaHtml = document.getElementById('textarea-html');

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

// Cambio de Modo: Proyecto Propio vs Portafolio
document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.mode;

        if (currentMode === 'custom') {
            customUploaderPanel.classList.remove('hidden');
            portfolioFilters.classList.add('hidden');
            renderCustomSuites();
            updateGlobalMetrics(customResultsStore);
        } else {
            customUploaderPanel.classList.add('hidden');
            portfolioFilters.classList.remove('hidden');
            renderPortfolioSuites();
            updateGlobalMetrics(resultsStore, TEST_TARGETS.length);
            if (resultsStore.length === 0) {
                runFullPortfolioAudit();
            }
        }
    });
});

// Filtros Modo Portafolio
document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderPortfolioSuites();
    });
});

// Exportar reporte en JSON
document.getElementById('btn-export-report').addEventListener('click', () => {
    const activeData = currentMode === 'custom' ? customResultsStore : resultsStore;
    if (!activeData || activeData.length === 0) {
        writeLog('⚠ No hay resultados para exportar todavía.', 'warn');
        return;
    }
    const payload = {
        generatedAt: new Date().toISOString(),
        mode: currentMode,
        totalScreens: activeData.length,
        results: activeData.map(r => ({
            name: r.target.name,
            path: r.target.url,
            passed: r.passed,
            buttonsCount: r.buttonsCount,
            linksCount: r.linksCount,
            checks: r.checks
        }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-audit-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    writeLog('📥 Reporte JSON exportado correctamente.', 'ok');
});

function isLocalCheckableUrl(rawUrl) {
    if (!rawUrl) return false;
    const trimmed = rawUrl.trim();
    return !(
        trimmed === 'about:blank' ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('tel:') ||
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:')
    );
}

// ============================================================================
// MOTOR DE AUDITORÍA PARA PROYECTOS SUBIDOS POR EL USUARIO (CARPETA / CÓDIGO)
// ============================================================================

function normalizeRelPath(baseFile, targetRel) {
    const cleanTarget = targetRel.split('?')[0].split('#')[0].trim().replace(/\\/g, '/');
    if (!cleanTarget) return '';
    const baseParts = baseFile.replace(/\\/g, '/').split('/');
    baseParts.pop(); // quitar nombre del archivo actual

    const relParts = cleanTarget.split('/');
    for (const part of relParts) {
        if (part === '.' || part === '') continue;
        if (part === '..') baseParts.pop();
        else baseParts.push(part);
    }
    return baseParts.join('/');
}

async function runE2ESandboxOnHtmlString(htmlContent, fileName) {
    sandboxOverlay.classList.add('hidden');
    sandboxUrl.textContent = `virtual://${fileName}`;
    const runtimeErrors = [];

    return new Promise((resolve) => {
        // Inyectar colector de errores JS y neutralizar alert/confirm bloqueantes en el sandbox
        const instrumentedHtml = htmlContent.replace(
            /<head([^>]*)>/i,
            `<head$1><script>
                window.__qaErrors = [];
                window.onerror = function(msg) { window.__qaErrors.push(String(msg)); };
                window.alert = function(m) { console.log('[QA Alert interceptado]:', m); };
                window.confirm = function() { return true; };
            </script>`
        );

        let finished = false;
        const done = (res) => {
            if (finished) return;
            finished = true;
            resolve(res);
        };

        const timer = setTimeout(() => done({ clickedCount: 0, runtimeErrors }), 2000);

        qaIframe.onload = async () => {
            clearTimeout(timer);
            let clickedCount = 0;
            try {
                const win = qaIframe.contentWindow;
                const doc = qaIframe.contentDocument;
                const shouldClick = document.getElementById('chk-autoclick')?.checked;

                if (shouldClick && doc && win) {
                    const safeBtns = Array.from(doc.querySelectorAll('button:not([type="submit"])')).slice(0, 12);
                    for (const btn of safeBtns) {
                        const onclickAttr = btn.getAttribute('onclick') || '';
                        // Evitar recargas o cierres de ventana
                        if (/location|reload|close|window\.open/i.test(onclickAttr)) continue;
                        try {
                            btn.click();
                            clickedCount++;
                        } catch (e) {
                            runtimeErrors.push(e.message);
                        }
                    }
                }
                if (win && Array.isArray(win.__qaErrors)) {
                    runtimeErrors.push(...win.__qaErrors);
                }
            } catch (err) {
                // Ignorar errores cross-origin si los hubiera
            }
            done({ clickedCount, runtimeErrors });
        };

        qaIframe.srcdoc = instrumentedHtml;
    });
}

async function auditCustomHtmlDocument(fileName, htmlText, virtualFileMap = null) {
    const checks = [];
    writeLog(`▶ Analizando archivo: ${fileName}`, 'info');

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // 1. Estructura Semántica & Meta
    const hasTitle = !!(doc.querySelector('title') && doc.querySelector('title').textContent.trim());
    checks.push({ label: hasTitle ? `Título <title>: "${doc.querySelector('title').textContent.trim().slice(0, 20)}"` : 'Falta etiqueta <title>', pass: hasTitle });

    const hasViewport = !!doc.querySelector('meta[name="viewport"]');
    checks.push({ label: 'Meta Viewport Responsivo', pass: hasViewport });

    // 2. Verificar IDs duplicados
    const allWithId = Array.from(doc.querySelectorAll('[id]'));
    const seenIds = new Set();
    const dupIds = new Set();
    allWithId.forEach(el => {
        const id = el.getAttribute('id');
        if (id) {
            if (seenIds.has(id)) dupIds.add(id);
            seenIds.add(id);
        }
    });
    if (dupIds.size === 0) {
        checks.push({ label: `IDs únicos (${seenIds.size} verificados)`, pass: true });
    } else {
        checks.push({ label: `IDs duplicados: #${Array.from(dupIds).join(', #')}`, pass: false });
        writeLog(`✖ IDs duplicados en ${fileName}: #${Array.from(dupIds).join(', #')}`, 'err');
    }

    // 3. Auditar Botones
    const buttons = Array.from(doc.querySelectorAll('button, input[type="button"], input[type="submit"]'));
    buttons.forEach((btn, idx) => {
        const text = (btn.textContent || btn.value || btn.getAttribute('aria-label') || btn.getAttribute('title') || '').trim();
        const hasIcon = !!btn.querySelector('i, svg, img, span');
        const isClose = btn.classList.contains('btn-close') || btn.hasAttribute('data-bs-dismiss');
        const isDisabled = btn.hasAttribute('disabled');
        const valid = text.length > 0 || hasIcon || isClose;

        const btnLabel = text ? `Botón "${text.slice(0, 22)}"` : `Botón #${idx + 1}`;
        checks.push({
            label: valid ? `${btnLabel}${isDisabled ? ' (disabled)' : ''}` : `${btnLabel} VACÍO (sin texto ni ícono)`,
            pass: valid
        });
        if (!valid) {
            writeLog(`✖ ${fileName}: ${btnLabel} está vacío (sin texto, ícono ni aria-label).`, 'err');
        }
    });

    // 4. Auditar Menús (<nav>, <a href>)
    const anchors = Array.from(doc.querySelectorAll('a'));
    anchors.forEach((a, idx) => {
        const rawHref = a.getAttribute('href');
        const text = (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 18) || `Link #${idx + 1}`;

        if (rawHref === null || rawHref.trim() === '') {
            checks.push({ label: `Link "${text}" sin atributo href`, pass: false });
            writeLog(`✖ ${fileName}: Enlace "${text}" no tiene atributo href válido.`, 'err');
            return;
        }

        // Si es ancla interna (#seccion), verificar que exista en el documento si tiene más de 1 caracter
        if (rawHref.startsWith('#') && rawHref.length > 1) {
            const targetId = rawHref.slice(1);
            const targetExists = !!doc.getElementById(targetId);
            checks.push({
                label: targetExists ? `Ancla menú "${rawHref}"` : `Ancla rota "${rawHref}" (no existe #${targetId})`,
                pass: targetExists
            });
            if (!targetExists) {
                writeLog(`✖ ${fileName}: El menú apunta a "${rawHref}" pero no existe ningún elemento con id="${targetId}".`, 'err');
            }
            return;
        }

        if (!isLocalCheckableUrl(rawHref)) {
            checks.push({ label: `Link externo "${text}"`, pass: true });
            return;
        }

        // Si tenemos un mapa virtual de archivos subidos, validar case-sensitive
        if (virtualFileMap) {
            const normTarget = normalizeRelPath(fileName, rawHref);
            if (virtualFileMap.has(normTarget)) {
                checks.push({ label: `Ruta menú "${rawHref}"`, pass: true });
            } else {
                const lowerMatch = Array.from(virtualFileMap.keys()).find(k => k.toLowerCase() === normTarget.toLowerCase());
                if (lowerMatch) {
                    checks.push({ label: `Error Mayúsc/Minúsc: "${rawHref}" (real: "${lowerMatch}")`, pass: false });
                    writeLog(`✖ ${fileName}: Error de mayúsculas/minúsculas en "${rawHref}" -> en disco es "${lowerMatch}" (fallará en GitHub Pages).`, 'err');
                } else {
                    checks.push({ label: `Archivo faltante: "${rawHref}"`, pass: false });
                    writeLog(`✖ ${fileName}: No se encontró el archivo enlazado "${rawHref}".`, 'err');
                }
            }
        } else {
            checks.push({ label: `Ruta relativa "${rawHref}"`, pass: true });
        }
    });

    // 5. Auditar Imágenes, CSS y Scripts locales
    const assets = Array.from(doc.querySelectorAll('img[src], script[src], link[rel="stylesheet"][href]'));
    assets.forEach((el, idx) => {
        const rawUrl = el.getAttribute('src') || el.getAttribute('href') || '';
        if (el.tagName === 'IMG') {
            const hasAlt = el.hasAttribute('alt');
            if (!hasAlt) {
                checks.push({ label: `Imagen sin atributo alt (${rawUrl.slice(-18)})`, pass: false });
            }
        }
        if (!isLocalCheckableUrl(rawUrl)) return;

        if (virtualFileMap) {
            const normTarget = normalizeRelPath(fileName, rawUrl);
            if (virtualFileMap.has(normTarget)) {
                checks.push({ label: `Recurso "${rawUrl}"`, pass: true });
            } else {
                const lowerMatch = Array.from(virtualFileMap.keys()).find(k => k.toLowerCase() === normTarget.toLowerCase());
                if (lowerMatch) {
                    checks.push({ label: `Case-Sensitive "${rawUrl}" -> "${lowerMatch}"`, pass: false });
                    writeLog(`✖ ${fileName}: Recurso "${rawUrl}" difiere en mayúsculas de "${lowerMatch}".`, 'err');
                } else {
                    checks.push({ label: `Recurso no encontrado "${rawUrl}"`, pass: false });
                    writeLog(`✖ ${fileName}: Recurso faltante "${rawUrl}".`, 'err');
                }
            }
        }
    });

    // 6. Ejecutar prueba E2E en vivo en el Sandbox
    const e2eRes = await runE2ESandboxOnHtmlString(htmlText, fileName);
    if (e2eRes.runtimeErrors.length === 0) {
        checks.push({ label: `E2E Sandbox (${e2eRes.clickedCount} botones clickeados sin errores JS)`, pass: true });
    } else {
        checks.push({ label: `Error JS en ejecución: ${e2eRes.runtimeErrors[0].slice(0, 35)}`, pass: false });
        writeLog(`✖ Error JS al probar botones en ${fileName}: ${e2eRes.runtimeErrors[0]}`, 'err');
    }

    const allPassed = checks.every(c => c.pass);
    writeLog(
        `${allPassed ? '✔' : '⚠'} ${fileName}: ${buttons.length} botones, ${anchors.length} enlaces (${checks.filter(c => c.pass).length}/${checks.length} OK)`,
        allPassed ? 'ok' : 'warn'
    );

    return {
        target: {
            id: `custom-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`,
            name: fileName,
            url: `Proyecto Usuario (${buttons.length} botones, ${anchors.length} links)`
        },
        checks,
        buttonsCount: buttons.length,
        linksCount: anchors.length,
        passed: allPassed,
        rawHtml: htmlText
    };
}

// Procesar lista de File objects (de input folder, input files o drag & drop)
async function handleUploadedFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    isRunning = true;
    customResultsStore = [];
    consoleOutput.innerHTML = '';

    const filesArray = Array.from(fileList);
    const virtualFileMap = new Map();

    // Detectar prefijo de carpeta raíz común si se subió una carpeta con webkitRelativePath
    let rootPrefix = '';
    if (filesArray[0].webkitRelativePath && filesArray[0].webkitRelativePath.includes('/')) {
        rootPrefix = filesArray[0].webkitRelativePath.split('/')[0] + '/';
    }

    filesArray.forEach(f => {
        const fullRel = (f.webkitRelativePath || f.name).replace(/\\/g, '/');
        const cleanRel = rootPrefix && fullRel.startsWith(rootPrefix) ? fullRel.slice(rootPrefix.length) : fullRel;
        virtualFileMap.set(cleanRel, f);
    });

    const htmlEntries = Array.from(virtualFileMap.entries()).filter(([pathName]) =>
        /\.(html|htm)$/i.test(pathName)
    );

    if (htmlEntries.length === 0) {
        writeLog('⚠ No se encontraron archivos .html en la selección.', 'warn');
        statusText.textContent = '⚠ Subí al menos un archivo .html para poder auditar.';
        isRunning = false;
        return;
    }

    writeLog(`📂 Proyecto cargado en memoria: ${virtualFileMap.size} archivos totales (${htmlEntries.length} páginas HTML).`, 'info');

    for (let i = 0; i < htmlEntries.length; i++) {
        const [relPath, fileObj] = htmlEntries[i];
        statusText.textContent = `Auditando (${i + 1}/${htmlEntries.length}): ${relPath}...`;
        const pct = Math.round(((i + 1) / htmlEntries.length) * 100);
        progressBar.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;

        const text = await fileObj.text();
        const res = await auditCustomHtmlDocument(relPath, text, htmlEntries.length > 1 || virtualFileMap.size > 1 ? virtualFileMap : null);
        customResultsStore.push(res);
        updateGlobalMetrics(customResultsStore);
        renderCustomSuites();
    }

    statusText.textContent = `✅ Auditoría de tu proyecto finalizada (${htmlEntries.length} archivo/s HTML).`;
    isRunning = false;
}

document.getElementById('input-folder').addEventListener('change', (e) => handleUploadedFiles(e.target.files));
document.getElementById('input-files').addEventListener('change', (e) => handleUploadedFiles(e.target.files));

// Drag and drop en Dropzone
const dropzone = document.getElementById('dropzone');
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer?.files?.length) {
        handleUploadedFiles(e.dataTransfer.files);
    }
});

// Botón "Cargar Ejemplo con Bugs" para demostrar cómo detecta errores
document.getElementById('btn-load-demo-broken').addEventListener('click', () => {
    textareaHtml.value = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Landing Demo con Bugs para QA</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; }
    nav { display: flex; gap: 12px; margin-bottom: 16px; }
    a { color: #38bdf8; }
    button { padding: 8px 14px; border-radius: 6px; border: none; background: #10b981; color: #042f2e; font-weight: bold; cursor: pointer; margin-right: 8px; }
  </style>
</head>
<body>
  <nav>
    <a href="#inicio">Inicio</a>
    <!-- Bug 1: Ancla a sección que no existe -->
    <a href="#precios-inexistentes">Precios</a>
    <!-- Bug 2: Link sin href -->
    <a>Contacto Roto</a>
  </nav>

  <section id="inicio">
    <h2>Prueba de Botones</h2>
    <button onclick="document.getElementById('msg').textContent = '¡Botón 1 funciona!'">Botón Correcto</button>
    <!-- Bug 3: Botón completamente vacío sin texto ni ícono -->
    <button></button>
    <!-- Bug 4: ID duplicado -->
    <div id="msg">Listo</div>
    <div id="msg">ID Duplicado</div>
  </section>
</body>
</html>`;
    writeLog('🐞 Código HTML de prueba con bugs cargado. Tocá "Auditar Código HTML".', 'info');
});

// Auditar código HTML pegado
document.getElementById('btn-audit-paste').addEventListener('click', async () => {
    if (isRunning) return;
    const code = textareaHtml.value.trim();
    if (!code) {
        writeLog('⚠ Pegá código HTML o tocá "Cargar Ejemplo con Bugs" primero.', 'warn');
        return;
    }
    isRunning = true;
    customResultsStore = [];
    consoleOutput.innerHTML = '';
    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';

    const res = await auditCustomHtmlDocument('codigo-pegado.html', code, null);
    customResultsStore.push(res);
    updateGlobalMetrics(customResultsStore);
    renderCustomSuites();
    statusText.textContent = '✅ Código HTML auditado en vivo.';
    isRunning = false;
});

function renderCustomSuites() {
    suitesContainer.innerHTML = '';

    if (customResultsStore.length === 0) {
        suitesContainer.innerHTML = `
            <div style="text-align: center; padding: 2.5rem 1rem; color: #94a3b8;">
                <i class="ph-duotone ph-file-html" style="font-size: 2.5rem; color: #10b981; display: block; margin-bottom: 0.5rem;"></i>
                <strong style="color: #f8fafc;">Todavía no cargaste ningún proyecto</strong>
                <p style="font-size: 0.82rem; margin-top: 0.3rem;">Subí tu carpeta HTML arriba, elegí archivos sueltos o probá el botón <em>"Cargar Ejemplo con Bugs"</em>.</p>
            </div>
        `;
        return;
    }

    customResultsStore.forEach(res => {
        const card = document.createElement('div');
        card.className = `suite-card ${res.passed ? 'passed' : 'failed'}`;
        const passCount = res.checks.filter(c => c.pass).length;
        const totalCount = res.checks.length;

        card.innerHTML = `
            <div class="suite-top">
                <div class="suite-title">
                    <i class="ph-fill ${res.passed ? 'ph-check-circle' : 'ph-warning-circle'}"
                       style="color: ${res.passed ? '#10b981' : '#ef4444'}; font-size: 1.25rem;"></i>
                    <div>
                        <h3>${res.target.name}</h3>
                        <span class="suite-path">${res.target.url}</span>
                    </div>
                </div>
                <div class="suite-actions">
                    <button class="btn-mini btn-preview-custom" data-id="${res.target.id}"><i class="ph ph-eye"></i> Previsualizar</button>
                </div>
            </div>
            <div class="suite-stats">
                <span class="chip ${res.passed ? 'ok' : 'err'}">${passCount}/${totalCount} Checks OK</span>
                <span class="chip"><i class="ph-fill ph-cursor-click"></i> ${res.buttonsCount} Botones</span>
                <span class="chip"><i class="ph-fill ph-compass"></i> ${res.linksCount} Enlaces</span>
            </div>
            <div class="suite-details open">
                <div class="check-grid">
                    ${res.checks.map(c => `
                        <div class="check-item ${c.pass ? 'pass' : 'fail'}" title="${c.label}">
                            <i class="ph-fill ${c.pass ? 'ph-check-circle' : 'ph-x-circle'}"></i>
                            <span>${c.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        suitesContainer.appendChild(card);
    });

    document.querySelectorAll('.btn-preview-custom').forEach(btn => {
        btn.addEventListener('click', () => {
            const found = customResultsStore.find(r => r.target.id === btn.dataset.id);
            if (found && found.rawHtml) {
                runE2ESandboxOnHtmlString(found.rawHtml, found.target.name);
            }
        });
    });
}

// ============================================================================
// MOTOR DE AUDITORÍA PARA PROYECTOS DEL PORTAFOLIO
// ============================================================================

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
        qaIframe.removeAttribute('srcdoc');
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

async function auditSinglePortfolioTarget(target) {
    const checks = [];
    let buttonsCount = 0;
    let linksCount = 0;

    writeLog(`▶ Auditando: ${target.name} (${target.url})`, 'info');

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
    } catch {
        checks.push({ label: `Fetch ${target.url}`, pass: false });
        writeLog(`✖ Fallo de red al cargar ${target.url}`, 'err');
        return { target, checks, buttonsCount, linksCount, passed: false };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const baseUrl = new URL(target.url, window.location.href);

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

    for (const sel of (target.expectedSelectors || [])) {
        const found = !!doc.querySelector(sel);
        checks.push({ label: `Selector UI "${sel}"`, pass: found });
    }

    await loadInSandbox(target.url);
    await new Promise(r => setTimeout(r, 180));

    if (target.e2eAction && qaIframe.contentDocument && qaIframe.contentWindow) {
        try {
            await target.e2eAction(qaIframe.contentDocument, qaIframe.contentWindow, writeLog);
            checks.push({ label: 'E2E Auto-Login & Navegación', pass: true });
        } catch {
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

function renderPortfolioSuites() {
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
            const result = await auditSinglePortfolioTarget(target);
            const idx = resultsStore.findIndex(r => r.target.id === target.id);
            if (idx >= 0) resultsStore[idx] = result;
            else resultsStore.push(result);
            updateGlobalMetrics(resultsStore, TEST_TARGETS.length);
            renderPortfolioSuites();
            isRunning = false;
        });
    });
}

function updateGlobalMetrics(store, expectedTotal = null) {
    const pagesDone = store.length;
    const totalBtns = store.reduce((acc, r) => acc + r.buttonsCount, 0);
    const totalLinks = store.reduce((acc, r) => acc + r.linksCount, 0);
    const totalChecks = store.reduce((acc, r) => acc + r.checks.length, 0);
    const passedChecks = store.reduce((acc, r) => acc + r.checks.filter(c => c.pass).length, 0);

    statPages.textContent = expectedTotal ? `${pagesDone} / ${expectedTotal}` : `${pagesDone}`;
    statButtons.textContent = totalBtns;
    statLinks.textContent = totalLinks;

    if (totalChecks > 0) {
        const pct = ((passedChecks / totalChecks) * 100).toFixed(1);
        statScore.textContent = `${pct}%`;
        badgeSummary.textContent = `${passedChecks}/${totalChecks} Checks OK`;
        badgeSummary.className = `status-badge ${passedChecks === totalChecks ? 'ok' : 'warn'}`;
    } else {
        statScore.textContent = '—';
        badgeSummary.textContent = 'Esperando proyecto';
        badgeSummary.className = 'status-badge neutral';
    }
}

async function runFullPortfolioAudit() {
    if (isRunning) return;
    // Cambiar al tab de portafolio si estaba en custom
    if (currentMode !== 'portfolio') {
        document.querySelector('.mode-tab[data-mode="portfolio"]')?.click();
        return;
    }

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

        const res = await auditSinglePortfolioTarget(target);
        resultsStore.push(res);
        updateGlobalMetrics(resultsStore, TEST_TARGETS.length);
        renderPortfolioSuites();
    }

    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';
    statusText.textContent = '✅ Auditoría completada: todos los proyectos fueron inspeccionados.';
    writeLog('🎉 Auditoría E2E finalizada con éxito.', 'ok');
    isRunning = false;
}

document.getElementById('btn-run-all').addEventListener('click', () => {
    if (currentMode !== 'portfolio') {
        document.querySelector('.mode-tab[data-mode="portfolio"]')?.click();
    } else {
        runFullPortfolioAudit();
    }
});

// Inicializar en modo Custom Project Uploader
renderCustomSuites();
writeLog('👋 Bienvenida a QA AutoTester Studio. Subí una carpeta HTML, pegá código o cambiá a la pestaña "Proyectos del Portafolio".', 'info');
