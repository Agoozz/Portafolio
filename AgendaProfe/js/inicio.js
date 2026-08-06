const clasesHoyValue = document.getElementById('clasesHoyValue');
const pendienteCobrarValue = document.getElementById('pendienteCobrarValue');
const packsActivosValue = document.getElementById('packsActivosValue');
const alumnosActivosValue = document.getElementById('alumnosActivosValue');
const proxClasesBody = document.getElementById('proxClasesBody');
const pagosPendientesList = document.getElementById('pagosPendientesList');

const formateadorMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

async function cargarDatos() {
  // Actualizar saludo dinámico según el usuario
  const usuario = localStorage.getItem('agendaProfe_usuario');
  if (usuario) {
    const saludoElement = document.getElementById('saludoUsuario');
    if (saludoElement) {
      const nombreCapitalizado = usuario.charAt(0).toUpperCase() + usuario.slice(1);
      saludoElement.innerHTML = `Hola, ${nombreCapitalizado} 👋`;
    }
  }

  const alumnos = obtenerAlumnos();
  const agenda = obtenerAgenda();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const clasesHoy = agenda.filter((clase) => {
    const fechaClase = new Date(clase.fecha + 'T00:00:00');
    return fechaClase.toDateString() === hoy.toDateString();
  });

  const alumnosActivos = alumnos.filter((alumno) => alumno.estado === 'Activo' || !alumno.estado);
  const alumnosDebedores = alumnos.filter((alumno) => alumno.servicio === 'debe' || Number(alumno.deuda || 0) > 0);
  const pendienteCobrar = alumnosDebedores.reduce((total, alumno) => total + Number(alumno.deuda || 0), 0);

  const alumnosConPack = alumnos.filter((alumno) => alumno.servicio === 'paquete' && (alumno.estado === 'Activo' || !alumno.estado));

  clasesHoyValue.textContent = clasesHoy.length;
  pendienteCobrarValue.textContent = formateadorMoneda.format(pendienteCobrar);
  packsActivosValue.textContent = alumnosConPack.length;
  alumnosActivosValue.textContent = alumnosActivos.length;

  renderProximasClases(agenda);
  renderPagosPendientes(alumnosDebedores);
  
  // Verificar advertencia de deudas para el usuario 'Maria'
  verificarAdvertenciaMaria(alumnos);
}

function verificarAdvertenciaMaria(alumnos) {
  const usuario = localStorage.getItem('agendaProfe_usuario');
  if (usuario !== 'maria') return;

  const desactivada = sessionStorage.getItem('agendaProfe_advertencia_desactivada') === 'true';
  if (desactivada) return;

  // Comprobar si hay algún alumno con clasesRestantes <= -3 (debe más de 2 clases)
  const tieneDeudoresDeClases = alumnos.some(alumno => 
    alumno.servicio === 'paquete' && Number(alumno.clasesRestantes || 0) <= -3
  );

  if (tieneDeudoresDeClases) {
    mostrarModalAdvertencia();
  }
}

function mostrarModalAdvertencia() {
  if (document.getElementById('modalAdvertenciaMaria')) return;

  const modalHTML = `
    <div class="modal fade" id="modalAdvertenciaMaria" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="modalAdvertenciaLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-danger text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold" id="modalAdvertenciaLabel">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>¡Advertencia de clases adeudadas!
            </h5>
          </div>
          <div class="modal-body p-4 text-center">
            <div class="text-danger mb-3">
              <i class="bi bi-person-x-fill" style="font-size: 3.5rem;"></i>
            </div>
            <h4 class="fw-bold mb-2 text-danger-emphasis">Saldos de clases vencidos</h4>
            <p class="text-secondary">
              Tenés alumnos que han consumido clases adicionales sin renovar su paquete (deben más de 2 clases).
            </p>
            <div class="alert alert-danger border-0 rounded-3 text-start small mb-0">
              <i class="bi bi-info-circle-fill me-2"></i>
              Para desactivar esta advertencia permanente, debés ingresar a tu <strong>panel de alumnos</strong> para revisar sus cuentas.
            </div>
          </div>
          <div class="modal-footer border-0 d-flex gap-2 justify-content-center pb-4">
            <button type="button" class="btn btn-light rounded-3 px-4 border" data-bs-dismiss="modal">
              Cerrar por ahora
            </button>
            <a href="alumnos.html" id="btnIrAlumnosAdvertencia" class="btn btn-danger rounded-3 px-4 fw-semibold shadow-sm">
              <i class="bi bi-arrow-right-short me-1"></i>Ir a Alumnos
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = modalHTML;
  document.body.appendChild(container.firstElementChild);

  const modalElem = document.getElementById('modalAdvertenciaMaria');
  const bootstrapModal = new bootstrap.Modal(modalElem);
  bootstrapModal.show();

  document.getElementById('btnIrAlumnosAdvertencia').onclick = () => {
    sessionStorage.setItem('agendaProfe_advertencia_desactivada', 'true');
  };
}

function obtenerAlumnos() {
  return window.getLocalStorage('alumnos', []);
}

function obtenerAgenda() {
  const guardados = window.getLocalStorage('agenda', []);
  return guardados.sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`));
}

function renderProximasClases(agenda) {
  const proximas = agenda
    .filter((clase) => new Date(`${clase.fecha}T${clase.hora}`) >= new Date())
    .slice(0, 5);

  if (!proximas.length) {
    proxClasesBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">No hay clases próximas registradas.</td>
      </tr>
    `;
    return;
  }

  proxClasesBody.innerHTML = proximas.map((clase) => {
    const hora = clase.hora || '00:00';
    const fecha = new Date(`${clase.fecha}T${hora}`).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    });

    const estadoClase = clase.estado === 'Programada' ? 'bg-primary-subtle text-primary' : clase.estado === 'Completada' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger';

    return `
      <tr>
        <td data-label="Hora">
          <span class="badge bg-primary rounded-pill px-3 py-2">${hora}</span>
        </td>
        <td data-label="Alumno" class="fw-semibold">${clase.alumno}</td>
        <td data-label="Materia">${clase.materia}</td>
        <td data-label="Estado">
          <span class="badge ${estadoClase} rounded-pill px-3 py-2">${clase.estado}</span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagosPendientes(alumnosDebedores) {
  if (!alumnosDebedores.length) {
    pagosPendientesList.innerHTML = `
      <div class="list-group-item px-0 text-muted">No hay deudas pendientes registradas.</div>
    `;
    return;
  }

  pagosPendientesList.innerHTML = alumnosDebedores.map((alumno) => `
    <a href="pagos.html?alumnoId=${alumno.id}" class="list-group-item list-group-item-action px-0 d-flex justify-content-between align-items-center border-0 bg-transparent">
      <span>${alumno.nombre} ${alumno.apellido} <i class="bi bi-arrow-right-short text-muted"></i></span>
      <strong class="text-danger">${formateadorMoneda.format(Number(alumno.deuda || 0))}</strong>
    </a>
  `).join('');
}



cargarDatos();
