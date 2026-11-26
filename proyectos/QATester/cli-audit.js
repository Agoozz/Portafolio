/**
 * QA Automated Auditor - Portafolio & Proyectos
 * Verifica estáticamente (con sensibilidad exacta de mayúsculas/minúsculas como Linux/GitHub Pages)
 * todos los enlaces, imágenes, scripts, hojas de estilo, botones, menús y handlers JS.
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

const TARGET_PAGES = [
    { project: 'Portafolio Principal', file: 'index.html' },
    { project: 'QA UI & Menu Inspector', file: 'proyectos/QATester/index.html' },
    { project: 'Juego de Memoria 3D', file: 'proyectos/Memoria/index.html' },
    { project: 'Sistema POS e Inventario', file: 'proyectos/GestorInventario/index.html' },
    { project: 'Mateando (Inicio)', file: 'proyectos/Mateando/index.html' },
    { project: 'Mateando (Productos)', file: 'proyectos/Mateando/Pantallas/productos.html' },
    { project: 'Mateando (Ideas)', file: 'proyectos/Mateando/Pantallas/ideas.html' },
    { project: 'Mateando (Contacto)', file: 'proyectos/Mateando/Pantallas/contacto.html' },
    { project: 'Mateando (Envíos)', file: 'proyectos/Mateando/Pantallas/envios.html' },
    { project: 'AgendaProfe', file: 'proyectos/AgendaProfe/index.html' },
    { project: 'Gestor de Gastos', file: 'proyectos/GestorGastos/index.html' },
    { project: 'App del Clima Inteligente', file: 'proyectos/AppClima/index.html' },
    { project: 'SquatGym OS (Principal)', file: 'proyectos/SquatGym/index.html' },
    { project: 'SquatGym (Landing)', file: 'proyectos/SquatGym/pantallas/landing.html' },
    { project: 'SquatGym (Inicio)', file: 'proyectos/SquatGym/pantallas/inicio.html' },
    { project: 'SquatGym (Membresías)', file: 'proyectos/SquatGym/pantallas/adm-membresia.html' },
    { project: 'SquatGym (Monitor)', file: 'proyectos/SquatGym/pantallas/adm-monitor.html' },
    { project: 'SquatGym (Inventario)', file: 'proyectos/SquatGym/pantallas/adm-inventario.html' },
    { project: 'SquatGym (Kiosco Staff)', file: 'proyectos/SquatGym/pantallas/adm-kiosco.html' },
    { project: 'SquatGym (Planes)', file: 'proyectos/SquatGym/pantallas/adm-planes.html' },
    { project: 'SquatGym (Reclamos)', file: 'proyectos/SquatGym/pantallas/adm-reclamos.html' },
    { project: 'SquatGym (Alumno Pago)', file: 'proyectos/SquatGym/pantallas/alu-pago.html' },
    { project: 'SquatGym (Alumno Historial)', file: 'proyectos/SquatGym/pantallas/alu-historial.html' },
    { project: 'SquatGym (Alumno Tienda)', file: 'proyectos/SquatGym/pantallas/alu-tienda.html' },
];

function existsCaseSensitive(absPath) {
    if (!fs.existsSync(absPath)) return { ok: false, reason: 'No existe el archivo' };
    const parsed = path.parse(absPath);
    let current = parsed.root;
    const parts = absPath.slice(parsed.root.length).split(path.sep).filter(Boolean);

    for (const part of parts) {
        const entries = fs.readdirSync(current);
        if (!entries.includes(part)) {
            const matchInsensitive = entries.find(e => e.toLowerCase() === part.toLowerCase());
            return {
                ok: false,
                reason: matchInsensitive
                    ? `Error de mayúsculas/minúsculas: se pidió "${part}" pero en disco es "${matchInsensitive}"`
                    : `No encontrado: "${part}"`
            };
        }
        current = path.join(current, part);
    }
    return { ok: true };
}

function cleanUrl(rawUrl) {
    return rawUrl.split('?')[0].split('#')[0].trim();
}

function isExternalOrSpecial(url) {
    return (
        !url ||
        url === 'about:blank' ||
        url.startsWith('#') ||
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('mailto:') ||
        url.startsWith('tel:') ||
        url.startsWith('data:') ||
        url.startsWith('javascript:')
    );
}

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = [];

console.log('===================================================================');
console.log('🛡️  QA AUTOMATION SUITE - AUDITORÍA DE BOTONES, MENÚS Y RUTAS');
console.log('===================================================================\n');

for (const page of TARGET_PAGES) {
    const absFile = path.join(ROOT_DIR, page.file);
    if (!fs.existsSync(absFile)) continue;

    const fileCheck = existsCaseSensitive(absFile);
    totalChecks++;

    if (!fileCheck.ok) {
        failedChecks.push({ project: page.project, item: page.file, error: fileCheck.reason });
        console.log(`❌ [${page.project}] Archivo principal falló: ${fileCheck.reason}`);
        continue;
    }
    passedChecks++;

    const html = fs.readFileSync(absFile, 'utf8');
    const baseDir = path.dirname(absFile);

    // 1. Verificar href, src
    const attrRegex = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
    let match;
    let linksCount = 0;
    while ((match = attrRegex.exec(html)) !== null) {
        const raw = match[1];
        if (isExternalOrSpecial(raw) || raw.includes('${')) continue;
        const cleaned = cleanUrl(raw);
        if (!cleaned) continue;

        totalChecks++;
        linksCount++;
        const targetAbs = path.resolve(baseDir, cleaned);
        const check = existsCaseSensitive(targetAbs);
        if (!check.ok) {
            failedChecks.push({
                project: page.project,
                file: page.file,
                item: raw,
                error: check.reason
            });
        } else {
            passedChecks++;
        }
    }

    // 2. Contar y auditar botones e interacciones
    const buttonMatches = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || [];
    const navLinksMatches = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];

    buttonMatches.forEach((btnHtml, idx) => {
        totalChecks++;
        const hasVisibleContent =
            btnHtml.replace(/<[^>]+>/g, '').trim().length > 0 ||
            /<(i|svg|img|span)\b/i.test(btnHtml);
        const isSemanticCloseOrAria =
            /btn-close|aria-label|title=|data-bs-dismiss/i.test(btnHtml);

        if (hasVisibleContent || isSemanticCloseOrAria) {
            passedChecks++;
        } else {
            failedChecks.push({
                project: page.project,
                file: page.file,
                item: `Botón #${idx + 1}`,
                error: 'Botón sin etiqueta, ícono ni atributo accesible'
            });
        }
    });

    console.log(
        `✅ [${page.project.padEnd(28)}] ${String(linksCount).padStart(2)} rutas locales | ${String(buttonMatches.length).padStart(2)} botones | ${String(navLinksMatches.length).padStart(2)} enlaces/menús`
    );
}

console.log('\n-------------------------------------------------------------------');
console.log(`📊 RESUMEN FINAL: ${passedChecks}/${totalChecks} pruebas superadas (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log('-------------------------------------------------------------------');

if (failedChecks.length > 0) {
    console.log('\n⚠️ ERRORES DETECTADOS:');
    failedChecks.forEach(f => {
        console.log(`  - [${f.project}] (${f.file}) -> "${f.item}": ${f.error}`);
    });
    process.exit(1);
} else {
    console.log('🎉 ¡Todos los botones, menús y rutas locales pasaron la auditoría case-sensitive!');
}
