function filtrarInventario() {
      // Ocultar botón "Nuevo Proveedor" para secretaria y encargado
      const btnNuevoProv = document.getElementById('btn-nuevo-proveedor');
      if (btnNuevoProv) {
          if (typeof rRol !== 'undefined' && (rRol === 'secretaria' || rRol === 'encargado')) {
              btnNuevoProv.classList.add('hidden');
          } else {
              btnNuevoProv.classList.remove('hidden');
          }
      }

      const busq  = document.getElementById('inv-search').value.toLowerCase();
      const orden = document.getElementById('inv-filter-orden').value;
      const cat   = document.getElementById('inv-filter-cat').value;

      let lista = inventarioDB.filter(p => {
          const matchBusq = p.nombre.toLowerCase().includes(busq) || p.proveedor.toLowerCase().includes(busq);
          const matchCat  = cat === "todos" || p.cat === cat;
          return matchBusq && matchCat;
      });

      if (orden === 'nombre')      lista.sort((a,b) => a.nombre.localeCompare(b.nombre));
      if (orden === 'margen') {
            lista.sort((a,b) => {
                const margenA = ((a.precio - a.costo) / a.precio) * 100;
                const margenB = ((b.precio - b.costo) / b.precio) * 100;
                return margenB - margenA;
            });
        }
      if (orden === 'egreso-desc') lista.sort((a,b) => b.costo - a.costo);
      if (orden === 'vencimiento') lista.sort((a,b) => new Date(a.vencimiento) - new Date(b.vencimiento));

      // Actualizar KPIs
      const pendientes = inventarioDB.filter(p => p.estado === 'Pendiente').length;
      const egresoTotal = inventarioDB.reduce((s,p) => s + p.costo, 0);
      const margenProm  = Math.round(inventarioDB.reduce((s,p) => s + ((p.precio - p.costo) / p.precio * 100), 0) / inventarioDB.length);
      const kpiP = document.getElementById('kpi-pendientes'); if(kpiP) kpiP.innerText = pendientes;
      const kpiE = document.getElementById('kpi-egreso'); if(kpiE) kpiE.innerText = '$' + egresoTotal.toLocaleString();
      const kpiM = document.getElementById('kpi-margen'); if(kpiM) kpiM.innerText = margenProm + '%';

      const today = new Date();
      const tbody = document.getElementById('tabla-inventario-body');
      tbody.innerHTML = lista.map((p, idx) => {
          const esPendiente = p.estado === 'Pendiente';
          const margen = Math.round((p.precio - p.costo) / p.precio * 100);
          const margenColor = margen >= 50 ? '#4ade80' : margen >= 30 ? '#facc15' : '#f87171';
          const venc = new Date(p.vencimiento);
          const diasVenc = Math.ceil((venc - today) / (1000*60*60*24));
          const vencStr = venc.toLocaleDateString('es-AR', {day:'2-digit', month:'short', year:'numeric'});
          const vencColor = diasVenc < 30 ? '#f87171' : diasVenc < 90 ? '#facc15' : '#64748b';
          return `
          <tr class="hover:bg-orange-500/5 transition">
              <td class="p-4 text-white font-black">${p.nombre}</td>
              <td class="p-4 text-slate-400 text-[10px] font-black">${p.proveedor}</td>
              <td class="p-4 text-red-400 font-black">$${p.costo.toLocaleString()}</td>
              <td class="p-4 text-green-400 font-black">$${p.precio.toLocaleString()}</td>
              <td class="p-4 font-black" style="color:${margenColor}">${margen}%</td>
              <td class="p-4 text-[10px] font-black" style="color:${vencColor}">${vencStr}</td>
              <td class="p-4">
                  <span style="padding:2px 10px;border-radius:9999px;font-size:9px;font-weight:900;text-transform:uppercase;
                      background:${esPendiente ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'};
                      color:${esPendiente ? '#f87171' : '#4ade80'};
                      border:1px solid ${esPendiente ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'};">
                      ${p.estado}
                  </span>
              </td>
              <td class="p-4 text-right">
                  ${esPendiente
                      ? `<button onclick="pagarProveedor(${inventarioDB.indexOf(p)})"
                          style="padding:5px 14px;border-radius:9999px;background:var(--naranja);color:white;font-size:9px;font-weight:900;text-transform:uppercase;border:none;cursor:pointer;">
                          Pagar
                         </button>`
                      : `<span style="font-size:9px;color:#4ade80;font-weight:900;">✔ Pagado</span>`
                  }
              </td>
          </tr>`;
      }).join('');
  }

// Simulación de cuentas bancarias de los proveedores del gimnasio
const proveedoresCuentasDB = {
    "Ivess": { cbu: "0170099920000009876543", alias: "IVESS.BEBIDAS.PAGOS" },
    "Speed Unlimited": { cbu: "0170099920000008765432", alias: "SPEED.ENERGIA.PAGOS" },
    "Ena Sport": { cbu: "0170099920000007654321", alias: "ENA.SUPLEMENTOS.PAGOS" },
    "Star Nutrition": { cbu: "0170099920000006543210", alias: "STAR.NUTRITION.CBU" },
    "Mervick": { cbu: "0170099920000005432109", alias: "MERVICK.SNACKS.PAGOS" }
};

function pagarProveedor(idx) {
      const p = inventarioDB[idx];
      if (!p || p.estado === 'Pagado') return;
      
      // Limpiar campos e inputs previos
      document.getElementById('prov-metodo').value = 'Efectivo';
      document.getElementById('prov-transf-comp').value = '';
      document.getElementById('prov-tarjeta-cvv').value = '';

      // Cargar datos de la cuenta destino del proveedor seleccionado
      const cuentaDest = proveedoresCuentasDB[p.proveedor] || { 
          cbu: "0000003100099999999999", 
          alias: `${p.proveedor.toUpperCase().replace(/\s+/g, '')}.PAGO` 
      };
      
      document.getElementById('prov-titular-dest').innerText = p.proveedor.toUpperCase();
      document.getElementById('prov-cbu-dest').innerText = cuentaDest.cbu;
      document.getElementById('prov-alias-dest').innerText = cuentaDest.alias;
      
      // Actualizar visibilidad de subpaneles
      actualizarCamposPagoProveedor();

      abrirM('modal-pago-proveedor');
      document.getElementById('prov-pago-nombre').innerText = p.nombre;
      document.getElementById('prov-pago-proveedor').innerText = p.proveedor;
      document.getElementById('prov-pago-monto').innerText = '$' + p.costo.toLocaleString();
      window._provIdx = idx;
  }
function confirmarPagoProveedor() {
      const idx = window._provIdx;
      const metodo = document.getElementById('prov-metodo').value;
      if (idx === undefined || !inventarioDB[idx]) return;

      // Validar según el método seleccionado (Desde la perspectiva de fondos propios de SquatGym)
      if (metodo === 'Transferencia') {
          const comp = document.getElementById('prov-transf-comp').value.trim();
          if (!comp) {
              mostrarToast("Por favor, ingrese el número de comprobante de la transferencia.", "error");
              return;
          }
      } else if (metodo === 'Tarjeta') {
          const cvv = document.getElementById('prov-tarjeta-cvv').value.trim();
          if (!cvv) {
              mostrarToast("Por favor, ingrese el CVV para autorizar la tarjeta corporativa.", "error");
              return;
          }
          if (cvv.length < 3) {
              mostrarToast("El CVV debe tener al menos 3 dígitos.", "error");
              return;
          }
      }

      inventarioDB[idx].estado = 'Pagado';
      cerrarM();
      setTimeout(() => {
          filtrarInventario();
          mostrarToast(`Pago a ${inventarioDB[idx].proveedor} registrado por ${metodo} ✔`, "exito");
      }, 100);
  }

// Control dinámico de los campos adicionales de pago en Proveedores
function actualizarCamposPagoProveedor() {
    const metodo = document.getElementById('prov-metodo').value;
    
    // Ocultar todos
    document.getElementById('prov-detalles-transf').classList.add('hidden');
    document.getElementById('prov-detalles-qr').classList.add('hidden');
    document.getElementById('prov-detalles-tarjeta').classList.add('hidden');
    
    // Mostrar el correspondiente
    if (metodo === 'Transferencia') {
        document.getElementById('prov-detalles-transf').classList.remove('hidden');
    } else if (metodo === 'QR') {
        document.getElementById('prov-detalles-qr').classList.remove('hidden');
    } else if (metodo === 'Tarjeta') {
        document.getElementById('prov-detalles-tarjeta').classList.remove('hidden');
    }
}

