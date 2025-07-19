import { mostrarCargaObtener, mostrarNotificacion, ocultarCargaObtener } from "./componentes.js";

/* ==================== FUNCITION DEL LOGIN ==================== */
function iniciarSesion() {
    const loginButton = document.getElementById('loginButton');

    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            const email = document.querySelector('.email').value;
            const password = document.querySelector('.password').value;
            const rememberMe = document.querySelector('.checkbox input').checked;

            // Basic validation
            if (!email || !password) {
                
                return;
            }

            // Remove any spaces from email/username
            const cleanEmail = email.trim();

            try {
                mostrarCargaObtener();
                const response = await fetch('/iniciar-sesion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: cleanEmail,
                        password
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la conexión');
                }

                const data = await response.json();

                if (data.success) {
                    mostrarNotificacion('Login exitoso',{tipo:'exito', duracion:2000})
                    if (rememberMe) {
                        localStorage.setItem('credentials', JSON.stringify({
                            email: cleanEmail,
                            password
                        }));
                    } else {
                        localStorage.removeItem('credentials');
                    }

                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                } else {
                    // Verificar si es un mensaje de cuenta en proceso
                    if (data.status === 'pending') {
                        mostrarNotificacion('Tu cuenta esta siendo procesada por la empresa')
                    } else {
                        mostrarNotificacion('Contraseña o email incorrecto',{tipo:'error'})
                    }
                    ocultarCargaObtener();
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });

        // Add enter key support for login
        document.querySelectorAll('.email, .password').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    loginButton.click();
                }
            });
        });
    }
}
/* ==================== INICIALIZACIÓN DE LA APP ==================== */
function inicializarApp() {
    const registerLink = document.querySelector('.sin-cuenta span');
    const forgotPasswordLink = document.querySelector('.olvido');
    const moreInfoLink = document.querySelector('.registro.mas-info');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            crearFormularioContraseña();
        });
    }
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            crearFormularioRegistro();
        });
    }

    if (moreInfoLink) {
        moreInfoLink.addEventListener('click', (e) => {
            e.preventDefault();
            crearFormularioInfo();
        });
    }

        const inputs = document.querySelectorAll('.entrada .input input');
    
        // Limpiar input de email
        const clearInputButton = document.querySelector('.clear-input');
        if (clearInputButton) {
            clearInputButton.addEventListener('click', (e) => {
                e.preventDefault();
                const emailInput = document.querySelector('.email');
                const label = emailInput.previousElementSibling;
                emailInput.value = '';
    
                // Forzar la actualización del label
                label.style.top = '50%';
                label.style.fontSize = 'var(--text-subtitulo)';
                label.style.color = 'gray';
                label.style.fontWeight = '400';
    
                // Disparar evento blur manualmente
                const blurEvent = new Event('blur');
                emailInput.dispatchEvent(blurEvent);
    
                // Disparar evento focus manualmente
                emailInput.focus();
                const focusEvent = new Event('focus');
                emailInput.dispatchEvent(focusEvent);
            });
        }
    
        // Mostrar/ocultar contraseña para el formulario de inicio de sesión
        document.querySelectorAll('.toggle-password').forEach(toggleButton => {
            toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                const passwordInput = toggleButton.parentElement.querySelector('input[type="password"], input[type="text"]');
                const icon = toggleButton.querySelector('i');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    
        const savedCredentials = JSON.parse(localStorage.getItem('credentials'));
        if (savedCredentials) {
            const emailInput = document.querySelector('.email');
            const passwordInput = document.querySelector('.password');
            if (emailInput) emailInput.value = savedCredentials.email;
            if (passwordInput) passwordInput.value = savedCredentials.password;
        }
    
        inputs.forEach(input => {
            const label = input.previousElementSibling;
    
            // Verificar el estado inicial
            if (input.value.trim() !== '') {
                label.style.transform = 'translateY(-75%) scale(0.85)';
                label.style.color = 'var(--cuarto)';
                label.style.fontWeight = '600';
            }
    
            input.addEventListener('focus', () => {
                label.style.transform = 'translateY(-75%) scale(0.85)';
                label.style.color = 'var(--cuarto)';
                label.style.fontWeight = '600';
            });
    
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    label.style.transform = 'translateY(-50%)';
                    label.style.color = 'gray';
                    label.style.fontWeight = '400';
                }
            });
            // Para los select, también manejar el evento de cambio
            if (input.tagName.toLowerCase() === 'select') {
                input.addEventListener('change', () => {
                    if (input.value.trim()) {
                        label.style.transform = 'translateY(-75%) scale(0.85)';
                        label.style.color = 'var(--cuarto)';
                        label.style.fontWeight = '600';
                        label.style.zIndex = '5';
                    } else {
                        label.style.transform = 'translateY(-50%)';
                        label.style.color = 'gray';
                        label.style.fontWeight = '400';
                    }
                });
            }
        });


    iniciarSesion();
}

document.addEventListener('DOMContentLoaded', async () => {
    inicializarApp();
});
