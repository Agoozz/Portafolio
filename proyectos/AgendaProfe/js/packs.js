const form = document.getElementById('packForm');
const tablaBody = document.getElementById('packTableBody');
const contador = document.getElementById('contadorPacks');
const materiasTableBody = document.getElementById('materiasTableBody');
const contadorMaterias = document.getElementById('contadorMaterias');
const modalPack = document.getElementById('modalPack');
const modalInstancia = bootstrap.Modal.getOrCreateInstance(modalPack);
const submitBtn = document.getElementById('guardarPackBtn');
const nuevaMateriaInput = document.getElementById('nuevaMateria');
const btnAgregarMateria = document.getElementById('agregarMateriaBtn');

let packs = [];
let materias = [];
let alumnos = [];
let clases = [];
let packEditandoId = null;

function ordenarPacks(lista) {
  return [...lista].sort((a, b) => Number(a.clases) - Number(b.clases) || String(a.nombre).localeCompare(String(b.nombre)));
}

function cargarDatos() {
  packs = ordenarPacks(window.getLocalStorage('packs', []));
  materias = window.getLocalStorage('materias', []);
  alumnos = window.getLocalStorage('alumnos', []);
  clases = window.getLocalStorage('agenda', []);
}

function renderTabla() {
  contador.textContent = `${packs.length} pack${packs.length === 1 ? '' : 's'}`;

  if (!packs.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">No hay packs cargados todavía. Agregá el primero.</td>
      </tr>
    `;
    return;
  }

  tablaBody.innerHTML = packs.map((pack) => `
    <tr>
      <td>
        <div class="fw-semibold">${pack.nombre}</div>
        <div class="small text-muted">Editable desde la tabla o con el modal</div>
      </td>
      <td>
        <input type="number" min="0" step="1" class="form-control form-control-sm rounded-3 precio-pack-input" data-id="${pack.id}" value="${pack.precio}" aria-label="Precio de ${pack.nombre}">
      </td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle" data-action="decrementar-clases" data-id="${pack.id}" aria-label="Restar clase">−</button>
          <span class="badge bg-primary-subtle text-primary px-3 py-2">${pack.clases} clases</span>
          <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle" data-action="incrementar-clases" data-id="${pack.id}" aria-label="Sumar clase">+</button>
        </div>
      </td>
      <td>
        <span class="badge ${pack.activo ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}">
          ${pack.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-sm btn-outline-primary" data-action="editar" data-id="${pack.id}">Editar</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="eliminar" data-id="${pack.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderMaterias() {
  contadorMaterias.textContent = `${materias.length} materia${materias.length === 1 ? '' : 's'}`;

  if (!materias.length) {
    materiasTableBody.innerHTML = `
      <tr>
        <td colspan="2" class="text-center text-muted py-4">No hay materias cargadas. Agregá la primera.</td>
      </tr>
    `;
    return;
  }

  materiasTableBody.innerHTML = materias.map((materia) => `
    <tr>
      <td class="fw-semibold">${materia}</td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-danger" data-action="eliminar-materia" data-materia="${encodeURIComponent(materia)}">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function limpiarFormulario() {
  form.reset();
  document.getElementById('packId').value = '';
  document.getElementById('precioPack').value = 0;
  document.getElementById('clasesPack').value = 4;
  packEditandoId = null;
  if (submitBtn) {
    submitBtn.textContent = 'Guardar pack';
  }
}

function cargarPackEnFormulario(pack) {
  document.getElementById('packId').value = pack.id;
  document.getElementById('nombrePack').value = pack.nombre;
  document.getElementById('precioPack').value = pack.precio;
  document.getElementById('clasesPack').value = pack.clases;
  packEditandoId = pack.id;
  if (submitBtn) {
    submitBtn.textContent = 'Actualizar pack';
  }
}

form.onsubmit = (event) => {
  event.preventDefault();

  const nombre = document.getElementById('nombrePack').value.trim();
  const precio = Number(document.getElementById('precioPack').value || 0);
  const clasesValue = Number(document.getElementById('clasesPack').value || 0);

  if (!nombre) {
    alert('Ingresá un nombre para el pack');
    return;
  }

  const pack = {
    id: packEditandoId || Date.now(),
    nombre,
    precio,
    clases: Math.max(1, clasesValue),
    activo: true
  };

  const listPacks = window.getLocalStorage('packs', []);
  if (packEditandoId) {
    const idx = listPacks.findIndex(p => p.id === packEditandoId);
    if (idx !== -1) {
      listPacks[idx] = { ...listPacks[idx], ...pack };
    }
  } else {
    listPacks.push(pack);
  }

  window.setLocalStorage('packs', listPacks);

  cargarDatos();
  renderTabla();
  limpiarFormulario();
  modalInstancia.hide();
};

const cancelarEdicionBtn = document.getElementById('cancelarEdicion');
cancelarEdicionBtn.onclick = () => {
  limpiarFormulario();
  modalInstancia.hide();
};

tablaBody.onclick = (event) => {
  const boton = event.target.closest('[data-action]');
  if (!boton) return;

  const packId = Number(boton.dataset.id);
  const pack = packs.find((item) => item.id === packId);
  if (!pack) return;

  if (boton.dataset.action === 'editar') {
    cargarPackEnFormulario(pack);
    modalInstancia.show();
  }

  if (boton.dataset.action === 'eliminar') {
    const enUsoAlumnos = alumnos.filter(a => a.servicio === 'paquete' && a.paquete === pack.nombre);
    
    const ejecutarEliminacion = () => {
      const listPacks = window.getLocalStorage('packs', []);
      const idx = listPacks.findIndex(p => p.id === packId);
      if (idx !== -1) {
        listPacks.splice(idx, 1);
        window.setLocalStorage('packs', listPacks);
        
        cargarDatos();
        renderTabla();
        if (packEditandoId === packId) {
          limpiarFormulario();
        }
      }
    };

    if (enUsoAlumnos.length) {
      const mensaje = `El pack "${pack.nombre}" está asignado a ${enUsoAlumnos.length} alumno(s).\n\n¿Estás seguro de que querés eliminarlo?`;
      window.mostrarConfirmacion("Eliminar pack", mensaje, (confirmado) => {
        if (confirmado) {
          ejecutarEliminacion();
        }
      });
    } else {
      window.mostrarConfirmacion("Eliminar pack", `¿Estás seguro de que querés eliminar el pack "${pack.nombre}"?`, (confirmado) => {
        if (confirmado) {
          ejecutarEliminacion();
        }
      });
    }
  }

  if (boton.dataset.action === 'incrementar-clases') {
    pack.clases += 1;
    const listPacks = window.getLocalStorage('packs', []);
    const idx = listPacks.findIndex(p => p.id === pack.id);
    if (idx !== -1) {
      listPacks[idx] = pack;
      window.setLocalStorage('packs', listPacks);
      renderTabla();
    }
  }

  if (boton.dataset.action === 'decrementar-clases') {
    pack.clases = Math.max(1, pack.clases - 1);
    const listPacks = window.getLocalStorage('packs', []);
    const idx = listPacks.findIndex(p => p.id === pack.id);
    if (idx !== -1) {
      listPacks[idx] = pack;
      window.setLocalStorage('packs', listPacks);
      renderTabla();
    }
  }
};

tablaBody.onchange = (event) => {
  if (!event.target.classList.contains('precio-pack-input')) return;

  const packId = Number(event.target.dataset.id);
  const pack = packs.find((item) => item.id === packId);
  if (!pack) return;

  pack.precio = Number(event.target.value || 0);
  const listPacks = window.getLocalStorage('packs', []);
  const idx = listPacks.findIndex(p => p.id === pack.id);
  if (idx !== -1) {
    listPacks[idx] = pack;
    window.setLocalStorage('packs', listPacks);
    renderTabla();
  }
};

document.getElementById('btnNuevoPack').onclick = () => {
  limpiarFormulario();
  modalInstancia.show();
};

btnAgregarMateria.onclick = () => {
  const nuevaMateria = nuevaMateriaInput.value.trim();

  if (!nuevaMateria) {
    alert('Ingresá una materia para agregarla');
    return;
  }

  if (materias.some((materia) => materia.toLowerCase() === nuevaMateria.toLowerCase())) {
    alert('Esa materia ya existe');
    return;
  }

  const listMaterias = window.getLocalStorage('materias', []);
  if (!listMaterias.includes(nuevaMateria)) {
    listMaterias.push(nuevaMateria);
    window.setLocalStorage('materias', listMaterias);
  }
  
  cargarDatos();
  renderMaterias();
  nuevaMateriaInput.value = '';
};

nuevaMateriaInput.onkeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    btnAgregarMateria.click();
  }
};

materiasTableBody.onclick = (event) => {
  const boton = event.target.closest('[data-action="eliminar-materia"]');
  if (!boton) return;

  const materia = decodeURIComponent(boton.dataset.materia);

  const enUsoAlumnos = alumnos.filter(a => a.materias && a.materias.includes(materia));
  const enUsoAgenda = clases.filter(c => c.materia === materia);

  const ejecutarEliminacionMateria = () => {
    const listMaterias = window.getLocalStorage('materias', []);
    const idx = listMaterias.findIndex(m => m === materia);
    if (idx !== -1) {
      listMaterias.splice(idx, 1);
      window.setLocalStorage('materias', listMaterias);
      
      cargarDatos();
      renderMaterias();
    }
  };

  if (enUsoAlumnos.length || enUsoAgenda.length) {
    let mensaje = `La materia "${materia}" está siendo usada en:\n`;
    if (enUsoAlumnos.length) {
      mensaje += `- ${enUsoAlumnos.length} alumno(s)\n`;
    }
    if (enUsoAgenda.length) {
      mensaje += `- ${enUsoAgenda.length} clase(s) programada(s)\n`;
    }
    mensaje += `\n¿Estás seguro de que querés eliminarla?`;
    
    window.mostrarConfirmacion("Eliminar materia", mensaje, (confirmado) => {
      if (confirmado) {
        ejecutarEliminacionMateria();
      }
    });
  } else {
    window.mostrarConfirmacion("Eliminar materia", `¿Estás seguro de que querés eliminar la materia "${materia}"?`, (confirmado) => {
      if (confirmado) {
        ejecutarEliminacionMateria();
      }
    });
  }
};



function init() {
  cargarDatos();
  renderTabla();
  renderMaterias();
  limpiarFormulario();
}

init();
