const STORAGE_KEY = 'agendaProfe_alumnos';
const PACKS_STORAGE_KEY = 'agendaProfe_packs';
const MATERIAS_STORAGE_KEY = 'agendaProfe_materias';

const form = document.getElementById('alumnoForm');
const tablaBody = document.getElementById('alumnoTableBody');
const contador = document.getElementById('contadorAlumnos');
const busqueda = document.getElementById('busqueda');
const filtroMateria = document.getElementById('filtroMateria');
const filtroServicio = document.getElementById('filtroServicio');
const filtroEstado = document.getElementById('filtroEstado');
const modalAlumno = document.getElementById('modalAlumno');
const paqueteClases = document.getElementById('paqueteClases');
const campoPaquete = document.getElementById('campoPaquete');
const submitBtn = document.getElementById('guardarAlumnoBtn');
const campoClasesRestantes = document.getElementById('campoClasesRestantes');
const clasesRestantesInput = document.getElementById('clasesRestantes');

let alumnos = [];
let alumnoEditandoId = null;
const modalInstancia = bootstrap.Modal.getOrCreateInstance(modalAlumno);

function cargarAlumnos() {
  alumnos = window.getLocalStorage('alumnos', []);
}

function obtenerMaterias() {
  return window.getLocalStorage('materias', []);
}

function actualizarCamposMaterias() {
  const listaMaterias = obtenerMaterias();
  
  const seleccionFiltroActual = filtroMateria.value;
  filtroMateria.innerHTML = '<option value="">Todas</option>' + listaMaterias.map(materia => `
    <option value="${materia}" ${materia === seleccionFiltroActual ? 'selected' : ''}>${materia}</option>
  `).join('');

  const materiasDiv = document.getElementById('materias');
  const checkboxesSeleccionados = Array.from(materiasDiv.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  materiasDiv.innerHTML = listaMaterias.map((materia, index) => `
    <div class="form-check mb-2">
      <input class="form-check-input" type="checkbox" value="${materia}" id="materia_${index}" ${checkboxesSeleccionados.includes(materia) ? 'checked' : ''}>
      <label class="form-check-label" for="materia_${index}">${materia}</label>
    </div>
  `).join('');
}

function toBadge(servicio, paquete) {
  const mapa = {
    paquete: 'bg-success-subtle text-success',
    clase: 'bg-primary-subtle text-primary',
    debe: 'bg-danger-subtle text-danger'
  };

  const etiqueta = {
    paquete: paquete ? `Paga paquete (${paquete})` : 'Paga paquete',
    clase: 'Paga por clase',
    debe: 'Debe'
  };

  return `<span class="badge ${mapa[servicio] || 'bg-secondary-subtle text-secondary'}">${etiqueta[servicio] || servicio}</span>`;
}

function obtenerPacksDisponibles() {
  return window.getLocalStorage('packs', []);
}

function actualizarListaPaquetes() {
  const packs = obtenerPacksDisponibles();
  const seleccionActual = paqueteClases.value;

  paqueteClases.innerHTML = '<option value="">Seleccioná un pack</option>' + packs.map((pack) => `
    <option value="${pack.nombre}" ${pack.nombre === seleccionActual ? 'selected' : ''}>
      ${pack.nombre} — ${pack.clases} clases
    </option>
  `).join('');

  if (packs.length > 0 && !seleccionActual) {
    paqueteClases.value = packs[0].nombre;
  }

  paqueteClases.disabled = packs.length === 0;
  if (packs.length === 0) {
    paqueteClases.innerHTML = '<option value="">No hay packs disponibles</option>';
  }
}

function renderTabla() {
  const termino = busqueda.value.trim().toLowerCase();
  const materiaFiltro = filtroMateria.value;
  const servicioFiltro = filtroServicio.value;
  const estadoFiltro = filtroEstado.value;

  const filtrados = alumnos.filter((alumno) => {
    const cumpleBusqueda = !termino ||
      alumno.nombre.toLowerCase().includes(termino) ||
      alumno.apellido.toLowerCase().includes(termino) ||
      `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(termino);

    const cumpleMateria = !materiaFiltro || (alumno.materias && alumno.materias.includes(materiaFiltro));
    const cumpleServicio = !servicioFiltro || alumno.servicio === servicioFiltro;
    const cumpleEstado = !estadoFiltro || alumno.estado === estadoFiltro;

    return cumpleBusqueda && cumpleMateria && cumpleServicio && cumpleEstado;
  });

  contador.textContent = `${filtrados.length} alumno${filtrados.length === 1 ? '' : 's'}`;

  if (filtrados.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">No hay alumnos cargados que coincidan con los filtros.</td>
      </tr>
    `;
    return;
  }

  tablaBody.innerHTML = filtrados.map((alumno) => `
    <tr>
      <td>
        <div class="fw-bold text-dark">${alumno.nombre} ${alumno.apellido}</div>
        <div class="small text-muted">Alta: ${new Date(alumno.fechaAlta).toLocaleDateString('es-AR')}</div>
      </td>
      <td>
        ${toBadge(alumno.servicio, alumno.paquete)}
        ${alumno.deuda > 0 ? `<div class="small text-danger mt-1 fw-bold">Debe: $${alumno.deuda.toLocaleString('es-AR')}</div>` : ''}
        ${alumno.servicio === 'paquete' ? `<div class="small text-muted mt-1">Saldo: <strong class="${(alumno.clasesRestantes || 0) <= 0 ? 'text-danger' : 'text-success'}">${alumno.clasesRestantes || 0}</strong> cl.</div>` : ''}
      </td>
      <td data-label="Materias">
        <div class="d-flex flex-wrap gap-1 justify-content-end justify-content-md-start">
          ${alumno.materias.map((materia) => `<span class="badge bg-light text-dark border">${materia}</span>`).join('')}
        </div>
      </td>
      <td data-label="Estado"><span class="badge bg-secondary-subtle text-secondary">${alumno.estado}</span></td>
      <td data-label="Contacto">
        <div>${alumno.telefono || 'Sin teléfono'}</div>
        <div class="small text-muted">${alumno.email || 'Sin email'}</div>
      </td>
      <td data-label="Acciones">
        <div class="d-flex gap-2 justify-content-end justify-content-md-start flex-wrap">
          ${alumno.servicio === 'paquete' ? `<button class="btn btn-sm btn-outline-success" data-action="renovar" data-id="${alumno.id}">Renovar Pack</button>` : ''}
          <button class="btn btn-sm btn-outline-primary" data-action="editar" data-id="${alumno.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="eliminar" data-id="${alumno.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function actualizarPaquete() {
  const servicio = document.getElementById('servicio').value;

  if (servicio === 'paquete') {
    actualizarListaPaquetes();
    campoPaquete.classList.remove('d-none');
    campoClasesRestantes.classList.remove('d-none');
    paqueteClases.setAttribute('required', '');
  } else {
    campoPaquete.classList.add('d-none');
    campoClasesRestantes.classList.add('d-none');
    paqueteClases.value = '';
    clasesRestantesInput.value = 0;
    paqueteClases.removeAttribute('required');
  }
}

function limpiarFormulario() {
  form.reset();
  actualizarCamposMaterias();
  actualizarListaPaquetes();
  document.getElementById('alumnoId').value = '';
  document.getElementById('deuda').value = 0;
  clasesRestantesInput.value = 0;
  document.querySelectorAll('#materias input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  actualizarPaquete();
  document.getElementById('estado').value = 'Activo';
  alumnoEditandoId = null;
  if (submitBtn) {
    submitBtn.textContent = 'Guardar alumno';
  }
}

function cargarAlumnoEnFormulario(alumno) {
  actualizarCamposMaterias();
  actualizarListaPaquetes();
  document.getElementById('alumnoId').value = alumno.id;
  document.getElementById('nombre').value = alumno.nombre;
  document.getElementById('apellido').value = alumno.apellido;
  document.getElementById('telefono').value = alumno.telefono || '';
  document.getElementById('email').value = alumno.email || '';
  document.getElementById('servicio').value = alumno.servicio;
  document.getElementById('deuda').value = alumno.deuda || 0;
  clasesRestantesInput.value = alumno.clasesRestantes || 0;
  document.getElementById('estado').value = alumno.estado;
  document.getElementById('observaciones').value = alumno.observaciones || '';
  paqueteClases.value = alumno.paquete || '';

  document.querySelectorAll('#materias input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = alumno.materias.includes(checkbox.value);
  });

  actualizarPaquete();
  if (submitBtn) {
    submitBtn.textContent = 'Actualizar alumno';
  }
}

form.onsubmit = (event) => {
  event.preventDefault();

  const materiasSeleccionadas = Array.from(document.querySelectorAll('#materias input[type="checkbox"]'))
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  const servicio = document.getElementById('servicio').value;
  const paqueteSeleccionado = servicio === 'paquete' ? paqueteClases.value : '';

  if (servicio === 'paquete' && !paqueteSeleccionado) {
    alert('Seleccioná un pack para el alumno');
    return;
  }

  const alumno = {
    id: alumnoEditandoId || Date.now(),
    nombre: document.getElementById('nombre').value.trim(),
    apellido: document.getElementById('apellido').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    email: document.getElementById('email').value.trim(),
    servicio,
    paquete: paqueteSeleccionado,
    clasesRestantes: servicio === 'paquete' ? Number(clasesRestantesInput.value || 0) : 0,
    deuda: Number(document.getElementById('deuda').value || 0),
    materias: materiasSeleccionadas,
    estado: document.getElementById('estado').value,
    observaciones: document.getElementById('observaciones').value.trim(),
    fechaAlta: new Date().toISOString()
  };

  const listAlumnos = window.getLocalStorage('alumnos', []);
  if (alumnoEditandoId) {
    const idx = listAlumnos.findIndex(a => a.id === alumnoEditandoId);
    if (idx !== -1) {
      listAlumnos[idx] = { ...listAlumnos[idx], ...alumno };
    }
  } else {
    listAlumnos.push(alumno);
    
    // Registrar pago automático inicial si corresponde
    if (servicio === 'paquete' && paqueteSeleccionado) {
      const packs = obtenerPacksDisponibles();
      const pack = packs.find(p => p.nombre === paqueteSeleccionado);
      if (pack) {
        const precioPack = Number(pack.precio || 0);
        const deudaIngresada = Number(document.getElementById('deuda').value || 0);
        const montoPago = precioPack - deudaIngresada;

        if (montoPago > 0) {
          const pagoInicial = {
            id: Date.now(),
            alumnoId: alumno.id,
            alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
            monto: montoPago,
            fecha: new Date().toISOString().split('T')[0],
            hora: new Date().toTimeString().slice(0, 5),
            metodo: 'Efectivo',
            observaciones: `Pago inicial de pack al registrar alumno (${paqueteSeleccionado})`
          };

          const listPagos = window.getLocalStorage('pagos', []);
          listPagos.push(pagoInicial);
          window.setLocalStorage('pagos', listPagos);
        }
      }
    }
  }

  window.setLocalStorage('alumnos', listAlumnos);

  cargarAlumnos();
  renderTabla();
  limpiarFormulario();
  
  // Cierre robusto del modal simulando clic en Cancelar para evitar congelamientos de fondo
  const dismissBtn = modalAlumno.querySelector('[data-bs-dismiss="modal"]');
  if (dismissBtn) {
    dismissBtn.click();
  } else {
    modalInstancia.hide();
  }
};

tablaBody.onclick = (event) => {
  const boton = event.target.closest('[data-action]');
  if (!boton) return;

  const action = boton.dataset.action;
  const alumnoId = Number(boton.dataset.id);

  if (action === 'renovar') {
    const alumno = alumnos.find((item) => item.id === alumnoId);
    if (alumno) {
      abrirModalRenovar(alumno);
    }
  }

  if (action === 'editar') {
    const alumno = alumnos.find((item) => item.id === alumnoId);
    if (alumno) {
      alumnoEditandoId = alumno.id;
      cargarAlumnoEnFormulario(alumno);
      modalInstancia.show();
    }
  }

  if (action === 'eliminar') {
    window.mostrarConfirmacion("Eliminar alumno", "¿Estás seguro de que querés eliminar este alumno?", (confirmado) => {
      if (confirmado) {
        const listAlumnos = window.getLocalStorage('alumnos', []);
        const index = listAlumnos.findIndex(a => a.id === alumnoId);
        if (index !== -1) {
          listAlumnos.splice(index, 1);
          window.setLocalStorage('alumnos', listAlumnos);
          
          cargarAlumnos();
          renderTabla();
          if (alumnoEditandoId === alumnoId) {
            limpiarFormulario();
          }
        }
      }
    });
  }
};

document.getElementById('servicio').onchange = actualizarPaquete;

paqueteClases.onchange = () => {
  const packs = obtenerPacksDisponibles();
  const seleccionado = packs.find(p => p.nombre === paqueteClases.value);
  if (seleccionado) {
    clasesRestantesInput.value = seleccionado.clases;
  } else {
    clasesRestantesInput.value = 0;
  }
};



[busqueda, filtroMateria, filtroServicio, filtroEstado].forEach((elemento) => {
  elemento.oninput = renderTabla;
  elemento.onchange = renderTabla;
});

function abrirModalRenovar(alumno) {
  document.getElementById('renovarAlumnoId').value = alumno.id;
  document.getElementById('renovarAlumnoNombre').textContent = `${alumno.nombre} ${alumno.apellido}`;
  
  const saldo = alumno.clasesRestantes || 0;
  const saldoElement = document.getElementById('renovarAlumnoSaldoActual');
  saldoElement.innerHTML = `Saldo actual: <strong class="${saldo <= 0 ? 'text-danger' : 'text-success'}">${saldo}</strong> cl.`;

  const packs = obtenerPacksDisponibles();
  const selectPack = document.getElementById('renovarSelectPack');
  
  selectPack.innerHTML = packs.map(pack => `
    <option value="${pack.nombre}" data-clases="${pack.clases}" data-precio="${pack.precio}">
      ${pack.nombre} (${pack.clases} clases — $${pack.precio})
    </option>
  `).join('');

  if (packs.length > 0) {
    const firstPack = packs[0];
    document.getElementById('renovarPrecio').value = firstPack.precio;
    selectPack.value = firstPack.nombre;
  }

  selectPack.onchange = () => {
    const opt = selectPack.options[selectPack.selectedIndex];
    if (opt) {
      document.getElementById('renovarPrecio').value = opt.dataset.precio;
    }
  };

  const modalRenovar = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRenovarPack'));
  modalRenovar.show();
}

function init() {
  // Desactivar la advertencia al entrar al panel de alumnos
  sessionStorage.setItem('agendaProfe_advertencia_desactivada', 'true');

  cargarAlumnos();
  actualizarCamposMaterias();
  actualizarListaPaquetes();
  renderTabla();
  limpiarFormulario();
  
  const btnAgregar = document.querySelector('[data-bs-target="#modalAlumno"]');
  if (btnAgregar) {
    btnAgregar.onclick = () => {
      limpiarFormulario();
    };
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('open') === 'alumno') {
    modalInstancia.show();
  }

  // Listener para confirmar renovación de pack
  const btnConfirmar = document.getElementById('btnConfirmarRenovacion');
  if (btnConfirmar && !btnConfirmar.dataset.bound) {
    btnConfirmar.dataset.bound = "true";
    btnConfirmar.onclick = () => {
      const alumnoId = Number(document.getElementById('renovarAlumnoId').value);
      const selectPack = document.getElementById('renovarSelectPack');
      const packNombre = selectPack.value;
      const opt = selectPack.options[selectPack.selectedIndex];
      
      if (!opt) {
        alert('Seleccioná un pack válido');
        return;
      }
      
      const clasesNuevas = Number(opt.dataset.clases);
      const montoPago = Number(document.getElementById('renovarPrecio').value);
      const metodo = document.getElementById('renovarMetodo').value;

      const alumno = alumnos.find(a => a.id === alumnoId);
      if (!alumno) return;

      const saldoAnterior = alumno.clasesRestantes || 0;
      const nuevoSaldo = saldoAnterior + clasesNuevas;

      const alumnoActualizado = {
        ...alumno,
        paquete: packNombre,
        clasesRestantes: nuevoSaldo,
        deuda: 0
      };

      const pago = {
        id: Date.now(),
        alumnoId: alumno.id,
        alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
        monto: montoPago,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        metodo: metodo,
        observaciones: `Renovación de pack: ${packNombre} (saldo previo: ${saldoAnterior} cl. -> nuevo saldo: ${nuevoSaldo} cl.)`
      };

      const listAlumnos = window.getLocalStorage('alumnos', []);
      const idx = listAlumnos.findIndex(a => a.id === alumnoId);
      if (idx !== -1) {
        listAlumnos[idx] = alumnoActualizado;
        window.setLocalStorage('alumnos', listAlumnos);
      }

      const listPagos = window.getLocalStorage('pagos', []);
      listPagos.push(pago);
      window.setLocalStorage('pagos', listPagos);

      cargarAlumnos();
      renderTabla();

      const modalRenovarElem = document.getElementById('modalRenovarPack');
      const dismissBtnRenovar = modalRenovarElem.querySelector('[data-bs-dismiss="modal"]');
      if (dismissBtnRenovar) {
        dismissBtnRenovar.click();
      } else {
        const modalRenovar = bootstrap.Modal.getOrCreateInstance(modalRenovarElem);
        modalRenovar.hide();
      }
    };
  }
}

init();
