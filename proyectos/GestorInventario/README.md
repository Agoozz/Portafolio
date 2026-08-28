# 🛒 SmartPOS - Sistema de Inventario y Ventas con IA

Un moderno sistema de Punto de Venta (POS) y Gestión de Inventario Full-Stack desarrollado como proyecto de portafolio. Combina una interfaz interactiva y veloz con características avanzadas, como el uso del hardware del dispositivo (cámara web) y sugerencias inteligentes de ventas cruzadas en tiempo real.

## ✨ Características Principales

*   **Punto de Venta (POS) Dinámico:** Agregado rápido de productos, cálculo automático de subtotales, totales y cambio/vuelto.
*   **Gestión de Inventario (CRUD):** Creación, lectura, actualización y eliminación de productos. Incluye sistema de control de stock y paginación para optimizar el rendimiento visual.
*   **📷 Escáner de Códigos de Barras:** Integración directa con la cámara web del dispositivo (PC o móvil) para escanear productos y agregarlos al carrito sin usar el teclado.
*   **🤖 Asistente de Ventas Inteligente:** Analiza el contenido del carrito en tiempo real y sugiere productos complementarios (*cross-selling*). Desarrollado con Node.js e integrado con el modelo LLM **Gemini 1.5 Flash**.
*   **🛡️ Arquitectura a prueba de fallos (Fallback):** Si el servidor Backend de IA no está disponible o falta la API Key, el frontend activa de forma silenciosa un **Motor de Reglas Basado en JavaScript**. El usuario final nunca ve un error y sigue recibiendo sugerencias al instante.
*   **Exportación e Impresión:** Generación de reportes de historial de ventas en formato Excel (.csv) e impresión de tickets de compra nativa.
*   **Personalización UI:** Sistema de temas dinámicos (Azul, Naranja, Rosado) construido sobre Bootstrap 5 y variables nativas de CSS.

## 🛠️ Tecnologías Utilizadas

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
*   **Framework UI:** Bootstrap 5 (Grids, Modales, Toasts, Cards).
*   **Backend:** Node.js, Express, Cors, Dotenv.
*   **Base de Datos:** LocalStorage API (Simulación de base de datos persistente en el navegador).
*   **Librerías Adicionales:** 
    *   `html5-qrcode` (Procesamiento de video y reconocimiento de patrones).
    *   `@google/generative-ai` (Google AI SDK).

## 🚀 Cómo ejecutar este proyecto en tu computadora

Este proyecto fue diseñado con la portabilidad en mente. Puedes ejecutarlo de dos maneras dependiendo de lo que desees evaluar:

### Opción A: Modo Frontend (Evaluación Rápida)
Ideal si solo deseas navegar por la interfaz y probar la lógica de la aplicación sin instalar dependencias.
1. Clona este repositorio o descarga los archivos en formato ZIP.
2. Abre el archivo `index.html` directamente en tu navegador (o usa una extensión como *Live Server* en VS Code).
3. **Resultado:** Toda la interfaz, el CRUD, el carrito y el escáner de cámara funcionarán perfectamente. El Asistente de Ventas detectará la ausencia del backend y utilizará el *Motor de Reglas Local* para sugerir productos.

### Opción B: Modo Full-Stack (Para evaluar la integración con IA)
Si deseas levantar el servidor local y probar las peticiones reales a la API de Inteligencia Artificial.
1. Abre tu terminal y navega a la carpeta del servidor: `cd backend`.
2. Instala las dependencias necesarias ejecutando: `npm install`.
3. Crea un archivo llamado `.env` dentro de la carpeta `backend` e ingresa tu API Key gratuita de [Google AI Studio](https://aistudio.google.com/):
   ```env
   GEMINI_API_KEY=tu_api_key_aqui
   ```
4. Inicia el servidor ejecutando: `npm start`. *(Verás un mensaje confirmando que el servidor corre en el puerto 3000)*.
5. Abre `index.html` en tu navegador. Ahora, al agregar productos al carrito, las sugerencias serán procesadas en tiempo real por Gemini.

---
*Desarrollado para demostrar habilidades integrales de programación: desde el maquetado responsivo, pasando por el manejo seguro de variables de entorno, hasta el diseño de arquitecturas resilientes enfocadas en la experiencia de usuario (UX).*
