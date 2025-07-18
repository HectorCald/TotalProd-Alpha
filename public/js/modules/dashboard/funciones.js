import { atajosPorRol, usuarioInfo, pluginsMenu } from "../../dashboard.js";
import { ocultarAtajosAll } from "./atajos.js";

export function mostrarFunciones() {
    renderFunciones();
    const funcionesContainer = document.querySelector('.funciones');
    if (funcionesContainer.classList.contains('activo')) {
        ocultarFunciones();
    } else {
        funcionesContainer.classList.add('activo');
        ocultarPerfil();
        ocultarNotificaciones();
        ocultarAtajosAll();
        mostrarOverlay();
    }
}

export function ocultarFunciones() {
    ocultarOverlay();
    const funcionesContainer = document.querySelector('.funciones');
    funcionesContainer.classList.remove('activo');
}

function renderFunciones() {
    const funcionesContainer = document.querySelector('.funciones');
    if (!funcionesContainer) return;
    funcionesContainer.innerHTML = '';

    // Orden específico de roles
    const ordenRoles = ['Administración', 'Producción', 'Almacen', 'Acopio'];

    // Obtener el rol del usuario actual
    const rolUsuario = usuarioInfo.rol;

    if (rolUsuario === 'Administración') {
        // Para administradores, mostrar todos los bloques
        ordenRoles.forEach(rol => {
            const atajosRol = atajosPorRol[rol] || [];
            if (atajosRol.length === 0) return;

            // Crear sección del rol
            const seccionRol = document.createElement('div');
            seccionRol.className = 'seccion-rol';

            // Título del rol
            const tituloRol = document.createElement('h3');
            tituloRol.className = 'titulo-rol';
            tituloRol.textContent = rol;
            seccionRol.appendChild(tituloRol);

            // Funciones del rol
            atajosRol.forEach((atajo) => {
                const btn = document.createElement('button');
                btn.className = 'funcion';
                btn.innerHTML = `<i class='fa ${atajo.icono}'></i><p>${atajo.texto}</p>`;

                btn.onclick = function () {
                    if (atajo.onclick) {
                        const funcionOriginal = new Function(atajo.onclick.replace('onclick=\"', '').replace('\"', ''));
                        funcionOriginal();
                    }
                    window.mostrarVistaCorrespondiente(atajo.vista);
                    ocultarFunciones();
                };

                seccionRol.appendChild(btn);
            });

            funcionesContainer.appendChild(seccionRol);
        });
    } else {
        // Para otros roles, mostrar solo sus funciones específicas
        const atajosRol = atajosPorRol[rolUsuario] || [];
        if (atajosRol.length > 0) {
            const seccionRol = document.createElement('div');
            seccionRol.className = 'seccion-rol';

            // Agregar título "Tus Funciones"
            const tituloRol = document.createElement('h3');
            tituloRol.className = 'titulo-rol';
            tituloRol.textContent = 'Tus Funciones';
            seccionRol.appendChild(tituloRol);

            atajosRol.forEach((atajo) => {
                const btn = document.createElement('button');
                btn.className = 'funcion';
                btn.innerHTML = `<i class='fa ${atajo.icono}'></i><p>${atajo.texto}</p>`;

                btn.onclick = function () {
                    if (atajo.onclick) {
                        const funcionOriginal = new Function(atajo.onclick.replace('onclick=\"', '').replace('\"', ''));
                        funcionOriginal();
                    }
                    window.mostrarVistaCorrespondiente(atajo.vista);
                    ocultarFunciones();
                };

                seccionRol.appendChild(btn);
            });

            funcionesContainer.appendChild(seccionRol);
            if (usuarioInfo.plugins) {
                const pluginsArray = usuarioInfo.plugins.split(',');
                if (pluginsArray.length > 0) {
                    const seccionPlugins = document.createElement('div');
                    seccionPlugins.className = 'seccion-rol';

                    const tituloPlugins = document.createElement('h3');
                    tituloPlugins.className = 'titulo-rol';
                    tituloPlugins.textContent = 'Extras';
                    seccionPlugins.appendChild(tituloPlugins);

                    pluginsArray.forEach(plugin => {
                        if (pluginsMenu[plugin.trim()]) {
                            const pluginData = pluginsMenu[plugin.trim()];
                            const btn = document.createElement('button');
                            btn.className = 'funcion';
                            btn.innerHTML = `<i class='fa ${pluginData.icono}'></i><p>${pluginData.texto}</p>`;

                            btn.onclick = function () {
                                if (pluginData.onclick) {
                                    const funcionOriginal = new Function(pluginData.onclick.replace('onclick=\"', '').replace('\"', ''));
                                    funcionOriginal();
                                }
                                window.mostrarVistaCorrespondiente(pluginData.vista);
                                ocultarFunciones();
                            };

                            seccionPlugins.appendChild(btn);
                        }
                    });

                    if (seccionPlugins.querySelectorAll('.funcion').length > 0) {
                        funcionesContainer.appendChild(seccionPlugins);
                    }
                }
            }
        }
    }
}