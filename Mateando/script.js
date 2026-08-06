document.addEventListener("DOMContentLoaded", function () {
  let carrito = JSON.parse(localStorage.getItem("carritoMateando")) || [];

  const botones = document.querySelectorAll(".add-cart");
  const contador = document.querySelector("#cart-count");
  const lista = document.querySelector("#cart-items");
  const total = document.querySelector("#cart-total");
  const mensaje = document.querySelector("#cart-message");

  function guardarCarrito() {
    localStorage.setItem("carritoMateando", JSON.stringify(carrito));
  }

  function actualizarCarrito() {
    let cantidadTotal = 0;
    const datosEnvio = JSON.parse(localStorage.getItem("envioMateando"));

    if (datosEnvio && lista) {
      lista.innerHTML += `
        <div class="cart-item mt-3">
          <div>
            <strong>Datos de entrega</strong>
            <p>Método: ${datosEnvio.metodo}</p>
            <p>Nombre: ${datosEnvio.nombre}</p>
            <p>DNI: ${datosEnvio.dni}</p>
            <p>Dirección: ${datosEnvio.direccion}, ${datosEnvio.ciudad}, ${datosEnvio.provincia}</p>
          </div>
        </div>
      `;
    }
    let suma = 0;

    carrito.forEach(function (producto) {
      cantidadTotal += producto.cantidad;
      suma += producto.precio * producto.cantidad;
    });

    if (contador) contador.textContent = cantidadTotal;
    if (!lista || !total) return;

    lista.innerHTML = "";

    if (carrito.length === 0) {
      lista.innerHTML = "<p class='text-muted'>Todavía no agregaste productos.</p>";
      total.textContent = "0";
      return;
    }

    carrito.forEach(function (producto, index) {
      lista.innerHTML += `
        <div class="cart-item">
          <div>
            <strong>${producto.nombre}</strong>
            <p>$${producto.precio} x ${producto.cantidad} = $${producto.precio * producto.cantidad}</p>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary restar-producto" data-index="${index}">-1</button>
            <button class="btn btn-sm btn-outline-danger eliminar-producto" data-index="${index}">Eliminar</button>
          </div>
        </div>
      `;
    });

    total.textContent = suma;
  }

  botones.forEach(function (boton) {
    boton.addEventListener("click", function () {
      const nombre = this.dataset.nombre;
      const precio = Number(this.dataset.precio);

      const productoExistente = carrito.find(function (producto) {
        return producto.nombre === nombre;
      });

      if (productoExistente) {
        productoExistente.cantidad++;
      } else {
        carrito.push({ nombre, precio, cantidad: 1 });
      }

      guardarCarrito();
      if (mensaje) mensaje.textContent = "Agregaste: " + nombre;
      actualizarCarrito();
    });
  });

  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("eliminar-producto")) {
      const index = e.target.dataset.index;
      carrito.splice(index, 1);
      guardarCarrito();
      actualizarCarrito();
    }

    if (e.target.classList.contains("restar-producto")) {
      const index = e.target.dataset.index;
      carrito[index].cantidad--;

      if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
      }

      guardarCarrito();
      actualizarCarrito();
    }

    if (e.target.classList.contains("confirmar-compra")) {
      const datosEnvio = JSON.parse(localStorage.getItem("envioMateando"));

      if (carrito.length === 0) {
        alert("Tu carrito está vacío. Agregá al menos un producto antes de confirmar la compra.");
        return;
      }

      if (!datosEnvio) {
        alert("Antes de confirmar la compra, seleccioná un método de envío o retiro.");
        return;
      }

      const numeroOrden = Math.floor(100000 + Math.random() * 900000);
      document.querySelector("#numero-orden").textContent = "#" + numeroOrden;

      const modalOrden = new bootstrap.Modal(document.querySelector("#ordenModal"));
      modalOrden.show();
    }

    if (e.target.closest(".finalizar-compra")) {
      carrito = [];
      guardarCarrito();
      localStorage.removeItem("envioMateando");
      actualizarCarrito();

      const ordenModal = bootstrap.Modal.getInstance(document.querySelector("#ordenModal"));
      if (ordenModal) ordenModal.hide();

      const carritoModal = bootstrap.Modal.getInstance(document.querySelector("#carritoModal"));
      if (carritoModal) carritoModal.hide();
    }
  });
  let envioSeleccionado = localStorage.getItem("envioMateando") || "";

  document.querySelectorAll(".seleccionar-envio").forEach(function (boton) {
    boton.addEventListener("click", function () {
      envioSeleccionado = this.dataset.envio;

      const formEnvio = document.querySelector("#form-envio");
      const tipoEnvio = document.querySelector("#tipo-envio-seleccionado");

      if (formEnvio && tipoEnvio) {
        formEnvio.classList.remove("d-none");
        tipoEnvio.textContent = "Método seleccionado: " + envioSeleccionado;
      }
    });
  });

  const botonGuardarEnvio = document.querySelector("#guardar-envio");

  if (botonGuardarEnvio) {
    botonGuardarEnvio.addEventListener("click", function () {
      const datosEnvio = {
        metodo: envioSeleccionado,
        nombre: document.querySelector("#nombre-envio").value,
        dni: document.querySelector("#dni-envio").value,
        direccion: document.querySelector("#direccion-envio").value,
        ciudad: document.querySelector("#ciudad-envio").value,
        provincia: document.querySelector("#provincia-envio").value
      };

      localStorage.setItem("envioMateando", JSON.stringify(datosEnvio));
      alert("Datos de entrega guardados correctamente.");
    });
  }
  actualizarCarrito();
});