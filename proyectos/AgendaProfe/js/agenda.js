const form = document.getElementById('agendaForm');
const tablaBody = document.getElementById('agendaTableBody');
const contador = document.getElementById('contadorClases');
const modalClase = document.getElementById('modalClase');
const modalInstancia = bootstrap.Modal.getOrCreateInstance(modalClase);
const submitBtn = document.getElementById('guardarClaseBtn');
const alumnoSelect = document.getElementById('alumnoClase');
const fechaInput = document.getElementById('fechaClase');
const horaInput = document.getElementById('horaClase');
const busquedaAlumno = document.getElementById('busquedaAlumno');
const filtroEstadoClase = document.getElementById('filtroEstadoClase');
const controlPaginado = document.getElementById('controlPaginado');

let clases = [];
let alumnos = [];
let materias = [];
let claseEditandoId = null;
let paginaActual = 1;
const itemsPorPagina = 10;

function cargarMaterias() {
  materias = window.getLocalStorage('materias', []);
}

function actualizarSelectMaterias() {
  const selectMateria = document.getElementById('materiaClase');
  const seleccionActual = selectMateria.value;

  selectMateria.innerHTML = '<option value="">Seleccioná una materia</option>' + materias.map((materia) => `
    <option value="${materia}" ${materia === seleccionActual ? 'selected' : ''}>
      ${materia}
    </option>
  `).join('');
}

function cargarClases() {
  const guardados = window.getLocalStorage('agenda', []);
  clases = guardados.sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`));
}

function cargarAlumnos() {
  alumnos = window.getLocalStorage('alumnos', []);
}

function cargarAlumnosEnSelect() {
  const seleccionActual = alumnoSelect.value;

  alumnoSelect.innerHTML = '<option value="">Seleccioná un alumno</option>' + alumnos.map((alumno) => `
    <option value="${alumno.nombre} ${alumno.apellido}" ${`${alumno.nombre} ${alumno.apellido}` === seleccionActual ? 'selected' : ''}>
      ${alumno.nombre} ${alumno.apellido}
    </option>
  `).join('');

  if (alumnos.length === 0) {
    alumnoSelect.innerHTML = '<option value="">No hay alumnos cargados</option>';
  }
}

function formatearFecha(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function renderTabla() {
  const termino = busquedaAlumno.value.trim().toLowerCase();
  const estadoFiltro = filtroEstadoClase.value;

  const filtradas = clases.filter((clase) => {
    const nombreAlumno = (clase.alumno || '').toLowerCase();
    const cumpleBusqueda = !termino || nombreAlumno.includes(termino);
    const cumpleEstado = !estadoFiltro || clase.estado === estadoFiltro;
    return cumpleBusqueda && cumpleEstado;
  });

  contador.textContent = `${filtradas.length} clase${filtradas.length === 1 ? '' : 's'}`;

  if (!filtradas.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">No hay clases programadas que coincidan con los filtros.</td>
      </tr>
    `;
    renderPaginacion(0);
    return;
  }

  // Ajustar paginaActual si queda fuera del rango por cambios de filtros
  const totalPaginas = Math.ceil(filtradas.length / itemsPorPagina);
  if (paginaActual > totalPaginas) {
    paginaActual = totalPaginas;
  }
  if (paginaActual < 1) {
    paginaActual = 1;
  }

  const inicioIdx = (paginaActual - 1) * itemsPorPagina;
  const finIdx = inicioIdx + itemsPorPagina;
  const itemsPagina = filtradas.slice(inicioIdx, finIdx);

  tablaBody.innerHTML = itemsPagina.map((clase) => `
    <tr>
      <td data-label="Fecha">${formatearFecha(clase.fecha)}</td>
      <td data-label="Hora">${clase.hora}</td>
      <td data-label="Alumno">${clase.alumno}</td>
      <td data-label="Materia">${clase.materia}</td>
      <td data-label="Estado"><span class="badge ${clase.estado === 'Completada' ? 'bg-success-subtle text-success' : clase.estado === 'Cancelada' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}">${clase.estado}</span></td>
      <td data-label="Acciones">
        <div class="d-flex gap-2 justify-content-end justify-content-md-start">
          <button type="button" class="btn btn-sm btn-outline-primary" data-action="editar" data-id="${clase.id}">Editar</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="eliminar" data-id="${clase.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPaginacion(filtradas.length);
}

function renderPaginacion(totalItems) {
  const infoPaginado = document.getElementById('infoPaginado');
  if (!controlPaginado || !infoPaginado) return;

  if (totalItems === 0) {
    infoPaginado.textContent = "Mostrando 0-0 de 0 clases";
    controlPaginado.innerHTML = '';
    return;
  }

  const totalPaginas = Math.ceil(totalItems / itemsPorPagina);
  const inicioIdx = (paginaActual - 1) * itemsPorPagina + 1;
  const finIdx = Math.min(paginaActual * itemsPorPagina, totalItems);

  infoPaginado.textContent = `Mostrando ${inicioIdx}-${finIdx} de ${totalItems} clases`;

  let html = '';

  // Botón Anterior
  html += `
    <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
      <button class="page-link" data-page="${paginaActual - 1}" aria-label="Anterior">
        <span aria-hidden="true">&laquo;</span>
      </button>
    </li>
  `;

  // Números de Página
  for (let i = 1; i <= totalPaginas; i++) {
    html += `
      <li class="page-item ${paginaActual === i ? 'active' : ''}">
        <button class="page-link" data-page="${i}">${i}</button>
      </li>
    `;
  }

  // Botón Siguiente
  html += `
    <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
      <button class="page-link" data-page="${paginaActual + 1}" aria-label="Siguiente">
        <span aria-hidden="true">&raquo;</span>
      </button>
    </li>
  `;

  controlPaginado.innerHTML = html;
}

if (controlPaginado) {
  controlPaginado.onclick = (event) => {
    const button = event.target.closest('.page-link');
    if (!button) return;

    const page = Number(button.dataset.page);
    if (isNaN(page)) return;

    paginaActual = page;
    renderTabla();
  };
}

function aplicarRestriccionesAgenda() {
  const hoy = new Date();
  const hoyISO = hoy.toISOString().split('T')[0];

  if (claseEditandoId) {
    fechaInput.removeAttribute('min');
  } else {
    fechaInput.setAttribute('min', hoyISO);
    fechaInput.min = hoyISO;
    if (!fechaInput.value) {
      fechaInput.value = hoyISO;
    }
  }

  horaInput.setAttribute('min', '06:00');
  horaInput.min = '06:00';
  horaInput.setAttribute('max', '23:59');
  horaInput.max = '23:59';
}

function limpiarFormulario() {
  form.reset();
  document.getElementById('claseId').value = '';
  claseEditandoId = null;
  aplicarRestriccionesAgenda();
  cargarAlumnosEnSelect();
  actualizarSelectMaterias();
  if (submitBtn) {
    submitBtn.textContent = 'Guardar clase';
  }
}

function cargarClaseEnFormulario(clase) {
  claseEditandoId = clase.id;
  document.getElementById('claseId').value = clase.id;
  document.getElementById('fechaClase').value = clase.fecha;
  document.getElementById('horaClase').value = clase.hora;
  actualizarSelectMaterias();
  document.getElementById('materiaClase').value = clase.materia;
  document.getElementById('estadoClase').value = clase.estado;
  document.getElementById('observacionesClase').value = clase.observaciones || '';
  cargarAlumnosEnSelect();
  alumnoSelect.value = clase.alumno;
  aplicarRestriccionesAgenda();
  if (submitBtn) {
    submitBtn.textContent = 'Actualizar clase';
  }
}

function adjustStudentClasses(studentName, delta) {
  const listAlumnos = window.getLocalStorage('alumnos', []);
  let modified = false;
  for (let i = 0; i < listAlumnos.length; i++) {
    const a = listAlumnos[i];
    const fullname = `${a.nombre} ${a.apellido}`.trim();
    if (fullname.toLowerCase() === studentName.trim().toLowerCase() && a.servicio === 'paquete') {
      a.clasesRestantes = (a.clasesRestantes || 0) + delta;
      modified = true;
      break;
    }
  }
  if (modified) {
    window.setLocalStorage('alumnos', listAlumnos);
  }
}

form.onsubmit = (event) => {
  event.preventDefault();

  const alumno = alumnoSelect.value.trim();
  const materia = document.getElementById('materiaClase').value;
  const fecha = document.getElementById('fechaClase').value;
  const hora = document.getElementById('horaClase').value;
  const estado = document.getElementById('estadoClase').value;

  if (!alumno) {
    alert('Seleccioná un alumno para la clase');
    return;
  }

  if (!fecha || !hora) {
    alert('Completá la fecha y la hora de la clase');
    return;
  }

  if (!claseEditandoId) {
    const fechaSeleccionada = new Date(`${fecha}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      alert('No se puede agendar una clase en una fecha anterior a hoy');
      return;
    }

    const horaNumero = Number(hora.split(':')[0]);
    if (horaNumero >= 0 && horaNumero < 6) {
      alert('Las clases deben agendarse a partir de las 06:00 AM');
      return;
    }

    const fechaHoraSeleccionada = new Date(`${fecha}T${hora}:00`);
    if (fechaHoraSeleccionada < new Date()) {
      alert('No se puede agendar una clase en una hora anterior a la actual');
      return;
    }
  }

  const clase = {
    id: claseEditandoId || Date.now(),
    alumno,
    materia,
    fecha,
    hora,
    estado,
    observaciones: document.getElementById('observacionesClase').value.trim()
  };

  const agendaList = window.getLocalStorage('agenda', []);
  if (claseEditandoId) {
    const index = agendaList.findIndex(c => c.id === claseEditandoId);
    if (index !== -1) {
      const prevClase = agendaList[index];
      if (prevClase.estado !== 'Completada' && estado === 'Completada') {
        adjustStudentClasses(alumno, -1);
      } else if (prevClase.estado === 'Completada' && estado !== 'Completada') {
        adjustStudentClasses(alumno, 1);
      }
      agendaList[index] = { ...prevClase, ...clase };
    }
  } else {
    if (estado === 'Completada') {
      adjustStudentClasses(alumno, -1);
    }
    agendaList.push(clase);
  }

  window.setLocalStorage('agenda', agendaList);

  cargarClases();
  renderTabla();
  limpiarFormulario();

  const dismissBtn = modalClase.querySelector('[data-bs-dismiss="modal"]');
  if (dismissBtn) {
    dismissBtn.click();
  } else {
    modalInstancia.hide();
  }
};

const cancelarEdicionBtn = document.getElementById('cancelarClase');
cancelarEdicionBtn.onclick = () => {
  limpiarFormulario();
  modalInstancia.hide();
};

tablaBody.onclick = (event) => {
  const boton = event.target.closest('[data-action]');
  if (!boton) return;

  const claseId = Number(boton.dataset.id);
  const agendaList = window.getLocalStorage('agenda', []);
  const clase = agendaList.find((item) => item.id === claseId);
  if (!clase) return;

  if (boton.dataset.action === 'editar') {
    cargarClaseEnFormulario(clase);
    modalInstancia.show();
  }

  if (boton.dataset.action === 'eliminar') {
    window.mostrarConfirmacion("Eliminar clase", "¿Estás seguro de que querés eliminar esta clase?", (confirmado) => {
      if (confirmado) {
        const index = agendaList.findIndex((item) => item.id === claseId);
        if (index !== -1) {
          const prevClase = agendaList[index];
          if (prevClase.estado === 'Completada') {
            adjustStudentClasses(prevClase.alumno, 1);
          }
          agendaList.splice(index, 1);
          window.setLocalStorage('agenda', agendaList);
          
          cargarClases();
          renderTabla();
          if (claseEditandoId === claseId) {
            limpiarFormulario();
          }
        }
      }
    });
  }
};

document.getElementById('btnNuevaClase').onclick = () => {
  limpiarFormulario();
  modalInstancia.show();
};



[busquedaAlumno, filtroEstadoClase].forEach((elemento) => {
  elemento.oninput = () => {
    paginaActual = 1;
    renderTabla();
  };
  elemento.onchange = () => {
    paginaActual = 1;
    renderTabla();
  };
});

function init() {
  cargarMaterias();
  cargarAlumnos();
  cargarClases();
  renderTabla();
  limpiarFormulario();
}

init();
