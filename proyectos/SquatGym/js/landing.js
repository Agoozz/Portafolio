// landing.js - Lógica para la Landing Page de SquatGym

// Muestra el modal de inicio de sesión que está en index.html
function mostrarLogin() {
    const loginFrame = document.getElementById('login-frame');
    if (loginFrame) {
        loginFrame.classList.remove('hidden');
        // Agregar una pequeña animación de entrada
        loginFrame.style.animation = 'fadeIn 0.3s ease-out forwards';
    }
}

// Cierra el modal de inicio de sesión (puede ser útil agregarlo al modal mismo)
function cerrarLogin() {
    const loginFrame = document.getElementById('login-frame');
    if (loginFrame) {
        loginFrame.classList.add('hidden');
    }
}

// Manejo del formulario de pre-registro
function enviarPreRegistro(e) {
    e.preventDefault();
    
    // Simular envío a la base de datos
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const msg = document.getElementById('msg-pre-registro');
    
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
    
    setTimeout(() => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Solicitar Contacto';
        
        // Limpiar inputs
        e.target.reset();
        
        // Mostrar mensaje de éxito
        msg.classList.remove('hidden');
        
        // Ocultar mensaje después de 4 segundos
        setTimeout(() => {
            msg.classList.add('hidden');
        }, 4000);
        
    }, 1500);
}

// Efecto de blur en el header al hacer scroll
document.addEventListener('scroll', function() {
    const header = document.querySelector('#landing-frame header');
    if (!header) return;
    
    const scrollContainer = document.getElementById('landing-frame');
    if (scrollContainer.scrollTop > 50) {
        header.classList.add('shadow-lg', 'bg-slate-950/90');
    } else {
        header.classList.remove('shadow-lg', 'bg-slate-950/90');
    }
});
