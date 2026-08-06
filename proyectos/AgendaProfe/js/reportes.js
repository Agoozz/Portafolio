const monthInput = document.getElementById('mesReporte');
const reporteMonthLabel = document.getElementById('reporteMonthLabel');
const alumnosAtendidosValue = document.getElementById('alumnosAtendidosValue');
const clasesMesValue = document.getElementById('clasesMesValue');
const pagosMesValue = document.getElementById('pagosMesValue');
const gananciaMesValue = document.getElementById('gananciaMesValue');
const reporteBody = document.getElementById('reporteBody');

const formateadorMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

let clases = [];
let pagos = [];

function cargarDatos() {
  clases = window.getLocalStorage('agenda', []);
  pagos = window.getLocalStorage('pagos', []);
}

function renderReporte() {
  const mesSeleccionado = monthInput.value || obtenerMesActual();
  monthInput.value = mesSeleccionado;

  const clasesMes = clases.filter((clase) =>
    clase.fecha?.startsWith(mesSeleccionado) && clase.estado !== 'Cancelada'
  );

  const pagosMes = pagos.filter((pago) =>
    pago.fecha?.startsWith(mesSeleccionado)
  );

  const totalGanado = pagosMes.reduce((total, pago) => total + Number(pago.monto || 0), 0);
  const alumnosAtendidos = new Set(clasesMes.map((clase) => clase.alumno)).size;

  const clasesPorAlumno = new Map();
  clasesMes.forEach((clase) => {
    clasesPorAlumno.set(clase.alumno, (clasesPorAlumno.get(clase.alumno) || 0) + 1);
  });

  const pagosPorAlumno = new Map();
  pagosMes.forEach((pago) => {
    pagosPorAlumno.set(pago.alumnoNombre, (pagosPorAlumno.get(pago.alumnoNombre) || 0) + Number(pago.monto || 0));
  });

  const pagosCountPorAlumno = new Map();
  pagosMes.forEach((pago) => {
    pagosCountPorAlumno.set(pago.alumnoNombre, (pagosCountPorAlumno.get(pago.alumnoNombre) || 0) + 1);
  });

  const alumnosReporte = Array.from(new Set([
    ...clasesMes.map((clase) => clase.alumno),
    ...pagosMes.map((pago) => pago.alumnoNombre)
  ]));

  alumnosReporte.sort((a, b) => {
    const clasesA = clasesPorAlumno.get(a) || 0;
    const clasesB = clasesPorAlumno.get(b) || 0;
    const ingresoA = pagosPorAlumno.get(a) || 0;
    const ingresoB = pagosPorAlumno.get(b) || 0;

    return (clasesB - clasesA) || (ingresoB - ingresoA) || a.localeCompare(b);
  });

  alumnosAtendidosValue.textContent = alumnosAtendidos;
  clasesMesValue.textContent = clasesMes.length;
  pagosMesValue.textContent = pagosMes.length;
  gananciaMesValue.textContent = formateadorMoneda.format(totalGanado);

  const fechaLabel = new Date(`${mesSeleccionado}-01T00:00:00`);
  const nombreMesCapitalizado = fechaLabel.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric'
  }).replace(/^\w/, (letra) => letra.toUpperCase());
  reporteMonthLabel.textContent = nombreMesCapitalizado;

  // Actualizar cabecera de impresión exclusiva
  const printDetalleMes = document.getElementById('printDetalleMes');
  const printNombreProfesorNew = document.getElementById('printNombreProfesorNew');
  const printFechaGeneradoNew = document.getElementById('printFechaGeneradoNew');
  const printResumenAlumnos = document.getElementById('printResumenAlumnos');
  const printResumenClases = document.getElementById('printResumenClases');
  const printResumenPagos = document.getElementById('printResumenPagos');
  const printResumenGanancia = document.getElementById('printResumenGanancia');

  if (printDetalleMes) {
    printDetalleMes.textContent = `Mes: ${nombreMesCapitalizado}`;
  }
  if (printNombreProfesorNew) {
    const usuario = localStorage.getItem('agendaProfe_usuario') || 'glo';
    printNombreProfesorNew.textContent = usuario.charAt(0).toUpperCase() + usuario.slice(1);
  }
  if (printFechaGeneradoNew) {
    const hoy = new Date();
    const fechaActualStr = hoy.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaActualStr = hoy.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    printFechaGeneradoNew.textContent = `${fechaActualStr} - ${horaActualStr}`;
  }
  if (printResumenAlumnos) {
    printResumenAlumnos.textContent = alumnosAtendidos;
  }
  if (printResumenClases) {
    printResumenClases.textContent = clasesMes.length;
  }
  if (printResumenPagos) {
    printResumenPagos.textContent = pagosMes.length;
  }
  if (printResumenGanancia) {
    printResumenGanancia.textContent = formateadorMoneda.format(totalGanado);
  }

  if (!alumnosReporte.length) {
    reporteBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">No hay clases ni pagos registrados para este mes.</td>
      </tr>
    `;
    return;
  }

  reporteBody.innerHTML = alumnosReporte.map((alumno) => `
    <tr>
      <td data-label="Alumno" class="fw-semibold">${alumno}</td>
      <td data-label="Clases"><span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">${clasesPorAlumno.get(alumno) || 0}</span></td>
      <td data-label="Pagos"><span class="badge bg-success-subtle text-success rounded-pill px-3 py-2">${pagosCountPorAlumno.get(alumno) || 0}</span></td>
      <td data-label="Total" class="fw-semibold text-primary">${formateadorMoneda.format(pagosPorAlumno.get(alumno) || 0)}</td>
    </tr>
  `).join('');
}

function obtenerMesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

monthInput.onchange = renderReporte;


function exportarExcel() {
  const table = document.querySelector('table.custom-table');
  if (!table) return;

  const csv = [];
  
  // Encabezados
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
  csv.push(headers.join(';'));
  
  // Filas
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td')).map(td => {
      return td.innerText.replace(td.getAttribute('data-label') || '', '').trim();
    });
    csv.push(cells.join(';'));
  });

  const csvContent = "\uFEFF" + csv.join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const mesSeleccionado = monthInput.value || 'Reporte';
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Reporte_Mensual_${mesSeleccionado}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarPDF() {
  window.print();
}

function init() {
  cargarDatos();
  renderReporte();

  document.getElementById('btnExportarPDF').onclick = exportarPDF;
  document.getElementById('btnExportarExcel').onclick = exportarExcel;
}

init();
