import {usuarioInfo } from "../../dashboard.js";
export function mostrarPerfil() {
    const nombre = document.querySelector('.editar-perfil .nombre')
    nombre.value = usuarioInfo.nombre + ' ' + usuarioInfo.apellido;
    const telefono = document.querySelector('.editar-perfil .telefono')
    telefono.value = usuarioInfo.telefono;
    const contraseña = document.querySelector('.editar-perfil .contraseña')
    contraseña.value = usuarioInfo.contraseña;
    const btnLoguot = document.querySelector('.editar-perfil .cerrar-sesion');
    const email = document.querySelector('.editar-perfil .email');
    email.textContent = usuarioInfo.email;

    const editarPerfil = document.querySelector('.editar-perfil');
    if (editarPerfil.classList.contains('activo')) {
        ocultarPerfil();
    } else {
        editarPerfil.classList.add('activo');
        ocultarFunciones();
        ocultarNotificaciones();
        mostrarOverlay();
    }
    configuracionesEntrada();

    btnLoguot.addEventListener('click', async () => {
        try {
            mostrarCarga();
            const response = await fetch('/cerrar-sesion', { method: 'POST' });
            if (response.ok) {
                localStorage.removeItem('damabrava_usuario');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            mostrarNotificacion('Error al cerrar sesión. Inténtalo de nuevo más tarde.');
        }
    });
}
export function ocultarPerfil() {
    ocultarOverlay();
    const editarPerfil = document.querySelector('.editar-perfil');
    editarPerfil.classList.remove('activo');
}
