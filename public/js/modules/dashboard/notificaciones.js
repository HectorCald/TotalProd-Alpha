export function mostrarNotificaciones() {
    const notificacionesContainer = document.querySelector('.notificaciones-container');
    if (notificacionesContainer.classList.contains('activo')) {
        ocultarNotificaciones();
    } else {
        notificacionesContainer.classList.add('activo');
        ocultarFunciones()
        ocultarPerfil();
    }
}
export function ocultarNotificaciones() {
    const notificacionesContainer = document.querySelector('.notificaciones-container');
    notificacionesContainer.classList.remove('activo');
    ocultarOverlay();
}