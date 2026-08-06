const loginForm = document.getElementById("loginForm");
const usuarioInput = document.getElementById("usuario");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

loginForm.onsubmit = (e) => {
  e.preventDefault();

  const usuario = usuarioInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  // Usuarios demo directos sin llamada a API
  const defaultUsers = [
    { usuario: 'glo', password: '1234' },
    { usuario: 'maria', password: '1234' }
  ];

  const user = defaultUsers.find(u => u.usuario === usuario && u.password === password);
  if (user) {
    localStorage.setItem("agendaProfe_usuario", user.usuario);
    window.location.href = "pantallas/inicio.html";
  } else {
    loginError.textContent = "Usuario o contraseña incorrectos.";
    loginError.classList.remove("d-none");
  }
};