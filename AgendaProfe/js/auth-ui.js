// Funciones globales de localStorage expuestas en window para evitar uso de API mock
window.getLocalStorage = function(key, defaultValue) {
  const usuario = localStorage.getItem('agendaProfe_usuario') || 'glo';
  const userKey = `agendaProfe_${usuario}_${key}`;
  const val = localStorage.getItem(userKey);
  if (val === null) {
    localStorage.setItem(userKey, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaultValue;
  }
};

window.setLocalStorage = function(key, value) {
  const usuario = localStorage.getItem('agendaProfe_usuario') || 'glo';
  const userKey = `agendaProfe_${usuario}_${key}`;
  localStorage.setItem(userKey, JSON.stringify(value));
};

// Rutina de sembrado automático de datos demo
window.seedDatabaseForUser = function(usuario) {
  const isSeededKey = `agendaProfe_${usuario}_seeded`;
  if (localStorage.getItem(isSeededKey)) return;

  // Packs por defecto
  localStorage.setItem(`agendaProfe_${usuario}_packs`, JSON.stringify([
    { id: 1, nombre: 'Pack básico', precio: 3200, clases: 4, activo: true },
    { id: 2, nombre: 'Pack intermedio', precio: 6000, clases: 8, activo: true },
    { id: 3, nombre: 'Pack completo', precio: 9000, clases: 12, activo: true }
  ]));

  // Materias por defecto
  localStorage.setItem(`agendaProfe_${usuario}_materias`, JSON.stringify([
    'Análisis matemático 1',
    'Análisis matemático 2',
    'Álgebra y geometría analítica',
    'Primario',
    'Secundario'
  ]));

  const hoy = new Date().toISOString().split('T')[0];
  const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const antesAyer = new Date(Date.now() - 172800000).toISOString().split('T')[0];
  const tresDias = new Date(Date.now() - 259200000).toISOString().split('T')[0];
  const mañana = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  if (usuario === 'glo') {
    localStorage.setItem(`agendaProfe_glo_alumnos`, JSON.stringify([
      { id: 101, nombre: 'Juan', apellido: 'Pérez', telefono: '11 9876-5432', email: 'juan.perez@mail.com', servicio: 'paquete', paquete: 'Pack básico', clasesRestantes: 2, deuda: 0, materias: ['Análisis matemático 1'], estado: 'Activo', observaciones: 'Prefiere clases por la tarde.', fechaAlta: antesAyer },
      { id: 102, nombre: 'Sofía', apellido: 'Gómez', telefono: '11 8765-4321', email: 'sofia.gomez@mail.com', servicio: 'clase', paquete: '', clasesRestantes: 0, deuda: 1200, materias: ['Álgebra y geometría analítica'], estado: 'Activo', observaciones: 'Paga por clase finalizada.', fechaAlta: tresDias },
      { id: 103, nombre: 'Mateo', apellido: 'Díaz', telefono: '11 7654-3210', email: 'mateo.diaz@mail.com', servicio: 'paquete', paquete: 'Pack completo', clasesRestantes: 8, deuda: 0, materias: ['Secundario'], estado: 'Activo', observaciones: 'Preparación de examen de ingreso escolar.', fechaAlta: ayer }
    ]));

    localStorage.setItem(`agendaProfe_glo_agenda`, JSON.stringify([
      { id: 201, alumno: 'Juan Pérez', materia: 'Análisis matemático 1', fecha: antesAyer, hora: '16:00', estado: 'Completada', observaciones: 'Límites laterales y continuidad.' },
      { id: 202, alumno: 'Sofía Gómez', materia: 'Álgebra y geometría analítica', fecha: hoy, hora: '18:00', estado: 'Programada', observaciones: 'Matrices e inversas por determinantes.' },
      { id: 203, alumno: 'Mateo Díaz', materia: 'Secundario', fecha: mañana, hora: '15:00', estado: 'Programada', observaciones: 'Resolución de ecuaciones de primer grado.' }
    ]));

    localStorage.setItem(`agendaProfe_glo_pagos`, JSON.stringify([
      { id: 301, alumnoId: 101, alumnoNombre: 'Juan Pérez', monto: 3200, fecha: antesAyer, hora: '16:15', metodo: 'Efectivo', observaciones: 'Pago completo de Pack básico.' },
      { id: 302, alumnoId: 102, alumnoNombre: 'Sofía Gómez', monto: 1000, fecha: tresDias, hora: '19:30', metodo: 'Transferencia', observaciones: 'Saldo de la clase anterior.' }
    ]));
  } else if (usuario === 'maria') {
    localStorage.setItem(`agendaProfe_maria_alumnos`, JSON.stringify([
      { id: 104, nombre: 'Carlos', apellido: 'Ramírez', telefono: '11 2345-6789', email: 'carlos@mail.com', servicio: 'paquete', paquete: 'Pack básico', clasesRestantes: -3, deuda: 2400, materias: ['Primario'], estado: 'Activo', observaciones: 'Debe 3 clases de matemáticas.', fechaAlta: tresDias },
      { id: 105, nombre: 'Ana', apellido: 'Torres', telefono: '11 3456-7890', email: 'ana.torres@mail.com', servicio: 'clase', paquete: '', clasesRestantes: 0, deuda: 0, materias: ['Análisis matemático 2'], estado: 'Activo', observaciones: 'Integrales múltiples.', fechaAlta: hoy },
      { id: 106, nombre: 'Luis', apellido: 'Rojas', telefono: '11 4567-8901', email: 'luis.rojas@mail.com', servicio: 'paquete', paquete: 'Pack intermedio', clasesRestantes: 4, deuda: 0, materias: ['Secundario'], estado: 'Activo', observaciones: 'Materia previa de física.', fechaAlta: antesAyer }
    ]));

    localStorage.setItem(`agendaProfe_maria_agenda`, JSON.stringify([
      { id: 204, alumno: 'Carlos Ramírez', materia: 'Primario', fecha: tresDias, hora: '17:00', estado: 'Completada', observaciones: 'Fracciones y sumas.' },
      { id: 205, alumno: 'Carlos Ramírez', materia: 'Primario', fecha: antesAyer, hora: '17:00', estado: 'Completada', observaciones: 'Decimales y multiplicaciones.' },
      { id: 206, alumno: 'Carlos Ramírez', materia: 'Primario', fecha: ayer, hora: '17:00', estado: 'Completada', observaciones: 'Divisiones por dos cifras.' },
      { id: 207, alumno: 'Ana Torres', materia: 'Análisis matemático 2', fecha: hoy, hora: '10:00', estado: 'Completada', observaciones: 'Cálculo de volumen mediante integrales dobles.' },
      { id: 208, alumno: 'Luis Rojas', materia: 'Secundario', fecha: mañana, hora: '16:00', estado: 'Programada', observaciones: 'Ejercicios de tiro vertical.' }
    ]));

    localStorage.setItem(`agendaProfe_maria_pagos`, JSON.stringify([
      { id: 303, alumnoId: 105, alumnoNombre: 'Ana Torres', monto: 1500, fecha: hoy, hora: '11:15', metodo: 'Mercado Pago', observaciones: 'Abono clase del día de la fecha.' },
      { id: 304, alumnoId: 106, alumnoNombre: 'Luis Rojas', monto: 6000, fecha: antesAyer, hora: '18:30', metodo: 'Transferencia', observaciones: 'Pago completo de Pack intermedio.' }
    ]));
  }

  localStorage.setItem(isSeededKey, 'true');
};

(function () {
  const usuario = localStorage.getItem('agendaProfe_usuario');

  if (!usuario) {
    window.location.href = '../index.html';
    return;
  }

  // Sembrar base de datos localmente si es necesario
  window.seedDatabaseForUser(usuario);

  // Manejo del botón de cerrar sesión (Salir)
  const salirBtns = document.querySelectorAll('a[href="../index.html"]');
  salirBtns.forEach((btn) => {
    if (btn.textContent.includes('Salir')) {
      btn.onclick = () => {
        const usuarioActivo = localStorage.getItem('agendaProfe_usuario');
        if (usuarioActivo === 'maria') {
          // Reseteamos el alumno de prueba Carlos Ramírez para poder probar la alerta otra vez
          try {
            const alumnosRaw = localStorage.getItem(`agendaProfe_maria_alumnos`);
            if (alumnosRaw) {
              const alumnos = JSON.parse(alumnosRaw);
              const carlos = alumnos.find(a => a.nombre.toLowerCase() === 'carlos' && a.apellido.toLowerCase() === 'ramírez');
              if (carlos) {
                carlos.clasesRestantes = -3;
                carlos.deuda = 2400; // Resetear deuda también
                carlos.paquete = 'Pack básico';
                localStorage.setItem(`agendaProfe_maria_alumnos`, JSON.stringify(alumnos));
              }
            }
            // Limpiamos los pagos de prueba registrados durante la demostración
            const pagosRaw = localStorage.getItem(`agendaProfe_maria_pagos`);
            if (pagosRaw) {
              const pagos = JSON.parse(pagosRaw);
              const pagosLimpios = pagos.filter(p => !(p.alumnoNombre.includes('Carlos Ramírez') && p.observaciones.includes('Renovación')));
              localStorage.setItem(`agendaProfe_maria_pagos`, JSON.stringify(pagosLimpios));
            }
          } catch (e) {
            console.error('Error al resetear demo:', e);
          }
        }

        localStorage.removeItem('agendaProfe_usuario');
        sessionStorage.removeItem('agendaProfe_alerta_pendiente_actualizada');
        sessionStorage.removeItem('agendaProfe_advertencia_desactivada');
      };
    }
  });

  const fab = document.createElement('div');
  fab.id = 'fab-acciones';
  fab.style.cssText = 'position:fixed;right:1.25rem;bottom:1.25rem;display:flex;flex-direction:column;align-items:flex-end;gap:0.75rem;z-index:1050;';
  fab.innerHTML = `
    <div class="fab-menu d-none flex-column bg-white rounded-4 p-2 shadow border" id="fabMenu" style="gap: 0.75rem;">
      <button type="button" class="btn btn-outline-primary rounded-pill text-start d-flex align-items-center gap-2 px-3 py-2 mb-2" data-action="alumno">
        <i class="bi bi-person-plus"></i>
        <span>Agregar alumno</span>
      </button>
      <button type="button" class="btn btn-outline-primary rounded-pill text-start d-flex align-items-center gap-2 px-3 py-2 mb-2" data-action="pago">
        <i class="bi bi-cash-stack"></i>
        <span>Agregar pago</span>
      </button>
      <button type="button" class="btn btn-outline-primary rounded-pill text-start d-flex align-items-center gap-2 px-3 py-2" data-action="paquete">
        <i class="bi bi-box-seam"></i>
        <span>Agregar paquete</span>
      </button>
    </div>
    <button type="button" class="fab-toggle btn btn-dark rounded-circle shadow-lg d-flex align-items-center justify-content-center" id="fabToggle" aria-label="Abrir menú de acciones" style="width:3.25rem;height:3.25rem;font-size:1.35rem;">
      <i class="bi bi-plus-lg"></i>
    </button>
  `;

  document.body.appendChild(fab);

  const fabToggle = document.getElementById('fabToggle');
  const fabMenu = document.getElementById('fabMenu');

  fabToggle.onclick = () => {
    fabMenu.classList.toggle('d-none');
    const isOpen = !fabMenu.classList.contains('d-none');
    fabToggle.setAttribute('aria-expanded', String(isOpen));
  };

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.onclick = () => {
      const action = button.dataset.action;

      const rutas = {
        alumno: 'alumnos.html?open=alumno',
        pago: 'pagos.html',
        paquete: 'packs.html'
      };

      if (rutas[action]) {
        window.location.href = rutas[action];
        return;
      }

      alert(`Acción de ${action} pendiente de implementación.`);
      fabMenu.classList.add('d-none');
      fabToggle.setAttribute('aria-expanded', 'false');
    };
  });

  document.onclick = (event) => {
    if (!fab.contains(event.target)) {
      fabMenu.classList.add('d-none');
      fabToggle.setAttribute('aria-expanded', 'false');
    }
  };
})();

window.mostrarAlerta = function(titulo, mensaje, tipo = 'primary') {
  const modalId = 'dynamic-alert-modal-' + Date.now();
  const html = `
    <div class="modal fade" id="${modalId}" data-bs-backdrop="static" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-${tipo} text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold" id="${modalId}Label">
              <i class="bi bi-info-circle-fill me-2"></i>${titulo}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="${modalId}-close"></button>
          </div>
          <div class="modal-body p-4 text-center">
            <p class="fs-5 mb-0 text-secondary">${mensaje}</p>
          </div>
          <div class="modal-footer border-0 d-flex justify-content-center pb-4">
            <button type="button" class="btn btn-${tipo} rounded-3 px-4 fw-semibold shadow-sm" data-bs-dismiss="modal" id="${modalId}-btn">
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container.firstElementChild);

  const modalElem = document.getElementById(modalId);
  const modal = new bootstrap.Modal(modalElem);
  modal.show();

  const handleClose = () => {
    setTimeout(() => {
      modalElem.remove();
    }, 500);
  };

  document.getElementById(`${modalId}-close`).onclick = handleClose;
  document.getElementById(`${modalId}-btn`).onclick = handleClose;
};

window.mostrarConfirmacion = function(titulo, mensaje, callback) {
  const modalId = 'dynamic-confirm-modal-' + Date.now();
  const mensajeFormateado = mensaje.replace(/\n/g, '<br>');
  
  const html = `
    <div class="modal fade" id="${modalId}" data-bs-backdrop="static" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-warning text-dark rounded-top-4 border-0">
            <h5 class="modal-title fw-bold" id="${modalId}Label">
              <i class="bi bi-question-circle-fill me-2"></i>${titulo}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" id="${modalId}-close"></button>
          </div>
          <div class="modal-body p-4 text-center">
            <p class="fs-5 mb-0 text-secondary">${mensajeFormateado}</p>
          </div>
          <div class="modal-footer border-0 d-flex gap-2 justify-content-center pb-4">
            <button type="button" class="btn btn-light rounded-3 px-4 border" data-bs-dismiss="modal" id="${modalId}-cancel">
              Cancelar
            </button>
            <button type="button" class="btn btn-warning rounded-3 px-4 fw-semibold shadow-sm" id="${modalId}-confirm">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container.firstElementChild);

  const modalElem = document.getElementById(modalId);
  const modal = new bootstrap.Modal(modalElem);
  
  const handleConfirm = () => {
    modal.hide();
    callback(true);
    setTimeout(() => {
      modalElem.remove();
    }, 500);
  };

  const handleCancel = () => {
    callback(false);
    setTimeout(() => {
      modalElem.remove();
    }, 500);
  };

  document.getElementById(`${modalId}-confirm`).onclick = handleConfirm;
  document.getElementById(`${modalId}-cancel`).onclick = handleCancel;
  document.getElementById(`${modalId}-close`).onclick = handleCancel;

  modal.show();
};

// Sobrescribir window.alert global
window.alert = function(mensaje) {
  window.mostrarAlerta('Atención', mensaje);
};

