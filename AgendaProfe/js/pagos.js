const form = document.getElementById('pagoForm');
const alumnoSelect = document.getElementById('alumnoPago');
const tablaBody = document.getElementById('pagosTableBody');
const contador = document.getElementById('contadorPagos');
const estadoVacio = document.getElementById('estadoVacio');
const btnRegistrarAlumno = document.getElementById('btnRegistrarAlumno');

let pagos = [];
let alumnos = [];

function cargarAlumnos() {
  alumnos = window.getLocalStorage('alumnos', []);
}

function cargarPagos() {
  const guardados = window.getLocalStorage('pagos', []);
  pagos = guardados.sort((a, b) => new Date(`${b.fecha}T${b.hora}`) - new Date(`${a.fecha}T${a.hora}`));
}

function popularAlumnosSelect() {
  const seleccionActual = alumnoSelect.value;

  alumnoSelect.innerHTML = '<option value="">Seleccioná un alumno</option>' + alumnos.map((alumno) => `
    <option value="${alumno.id}" ${String(alumno.id) === String(seleccionActual) ? 'selected' : ''}>
      ${alumno.nombre} ${alumno.apellido} (${alumno.servicio === 'paquete' ? 'Paquete' : 'Clase'})
    </option>
  `).join('');

  if (alumnos.length === 0) {
    alumnoSelect.innerHTML = '<option value="">No hay alumnos registrados</option>';
    alumnoSelect.disabled = true;
    estadoVacio.classList.remove('d-none');
  } else {
    alumnoSelect.disabled = false;
    estadoVacio.classList.add('d-none');
  }
}

function renderTabla() {
  contador.textContent = `${pagos.length} pago${pagos.length === 1 ? '' : 's'}`;

  if (!pagos.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">Todavía no hay pagos registrados.</td>
      </tr>
    `;
    return;
  }

  tablaBody.innerHTML = pagos.map((pago) => `
    <tr>
      <td data-label="Alumno">${pago.alumnoNombre}</td>
      <td data-label="Monto">$${Number(pago.monto).toLocaleString('es-AR')}</td>
      <td data-label="Fecha">${new Date(`${pago.fecha}T${pago.hora || '00:00'}`).toLocaleDateString('es-AR')}</td>
      <td data-label="Método">${pago.metodo}</td>
      <td data-label="Detalles">${pago.observaciones || 'Sin observaciones'}</td>
    </tr>
  `).join('');
}

form.onsubmit = (event) => {
  event.preventDefault();

  const alumnoId = alumnoSelect.value;
  const alumno = alumnos.find((item) => String(item.id) === String(alumnoId));

  if (!alumno) {
    alert('Seleccioná un alumno válido para registrar el pago');
    return;
  }

  const monto = Number(document.getElementById('montoPago').value || 0);
  if (!monto || monto <= 0) {
    alert('Ingresá un monto mayor a cero');
    return;
  }

  const pago = {
    id: Date.now(),
    alumnoId: alumno.id,
    alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
    monto,
    fecha: document.getElementById('fechaPago').value || new Date().toISOString().split('T')[0],
    hora: document.getElementById('horaPago').value || new Date().toTimeString().slice(0, 5),
    metodo: document.getElementById('metodoPago').value,
    observaciones: document.getElementById('observacionesPago').value.trim()
  };

  const listAlumnos = window.getLocalStorage('alumnos', []);
  const idx = listAlumnos.findIndex(a => a.id === alumno.id);
  if (idx !== -1) {
    listAlumnos[idx].deuda = Math.max(0, (listAlumnos[idx].deuda || 0) - monto);
    window.setLocalStorage('alumnos', listAlumnos);
  }

  const listPagos = window.getLocalStorage('pagos', []);
  listPagos.push(pago);
  window.setLocalStorage('pagos', listPagos);

  cargarPagos();
  cargarAlumnos();
  renderTabla();
  form.reset();
  document.getElementById('fechaPago').value = new Date().toISOString().split('T')[0];
  document.getElementById('horaPago').value = new Date().toTimeString().slice(0, 5);
  popularAlumnosSelect();
};

btnRegistrarAlumno.onclick = () => {
  window.location.href = 'alumnos.html?open=alumno';
};



function init() {
  const params = new URLSearchParams(window.location.search);
  const alumnoIdParam = params.get('alumnoId');

  cargarAlumnos();
  cargarPagos();
  
  if (alumnoIdParam) {
    alumnoSelect.value = alumnoIdParam;
  }

  popularAlumnosSelect();
  renderTabla();

  const fechaHoy = new Date().toISOString().split('T')[0];
  const horaActual = new Date().toTimeString().slice(0, 5);
  document.getElementById('fechaPago').value = fechaHoy;
  document.getElementById('horaPago').value = horaActual;
}

init();
