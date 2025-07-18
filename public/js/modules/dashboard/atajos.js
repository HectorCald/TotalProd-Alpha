// ========== ATAJOS DINÁMICOS ==========
import { usuarioInfo, atajosPorRol, pluginsMenu } from "../../dashboard.js";
let atajosSeleccionados = [];
let atajoAgregarIndex = null;
const MAX_ATAJOS = 5;
let modoEliminar = false;

function renderAtajosPrincipales() {
    const contenedor = document.getElementById('atajos-principales');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    // Renderiza los atajos seleccionados
    atajosSeleccionados.forEach((atajo, idx) => {
        const btn = document.createElement('button');
        btn.className = 'atajo';
        btn.innerHTML = `<i class='fa ${atajo.icono}'></i><p>${atajo.texto}</p>`;

        let longPressDetected = false;

        // Crear función personalizada que ejecuta el onclick original y muestra la vista correspondiente
        btn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();

            // No ejecutar si se hace clic en el botón minus
            if (e.target.closest('.atajo-minus-btn')) {
                return;
            }

            // No ejecutar si fue un long press
            if (longPressDetected) {
                longPressDetected = false;
                return;
            }

            // No ejecutar si estamos en modo eliminar
            if (modoEliminar) {
                console.log('Modo eliminar activo, no ejecutando onclick');
                return;
            }

            // No ejecutar si el atajo está en modo eliminar (tiene el botón minus visible)
            if (btn.classList.contains('delete')) {
                console.log('Atajo en modo eliminar, no ejecutando onclick');
                return;
            }

            // Ejecutar la función original si existe
            if (atajo.onclick) {
                const funcionOriginal = new Function(atajo.onclick.replace('onclick=\"', '').replace('\"', ''));
                funcionOriginal();
            }

            // Mostrar la vista correspondiente usando la función global
            window.mostrarVistaCorrespondiente(atajo.vista);
        };

        // Long press para mostrar botón minus en todos los atajos
        let pressTimer;
        btn.addEventListener('mousedown', (e) => {
            // No permitir interacción si estamos en modo eliminar
            if (modoEliminar || btn.classList.contains('delete')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            pressTimer = setTimeout(() => {
                longPressDetected = true;
                activarModoEliminar();
            }, 500);
        });
        btn.addEventListener('touchstart', (e) => {
            // No permitir interacción si estamos en modo eliminar
            if (modoEliminar || btn.classList.contains('delete')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            pressTimer = setTimeout(() => {
                longPressDetected = true;
                activarModoEliminar();
            }, 500);
        });
        btn.addEventListener('mouseup', (e) => clearTimeout(pressTimer));
        btn.addEventListener('mouseleave', (e) => clearTimeout(pressTimer));
        btn.addEventListener('touchend', (e) => clearTimeout(pressTimer));
        contenedor.appendChild(btn);
    });
    // Rellena con botones Agregar hasta MAX_ATAJOS
    for (let i = atajosSeleccionados.length; i < MAX_ATAJOS; i++) {
        const btnAgregar = document.createElement('button');
        btnAgregar.className = 'atajo-vacio';
        btnAgregar.innerHTML = `<i class='bx bx-plus'></i><p>Agregar</p>`;
        btnAgregar.onclick = () => mostrarAtajoAll(i);
        contenedor.appendChild(btnAgregar);
    }
}
function guardarAtajosPrincipales() {
    if (!usuarioInfo || !usuarioInfo.id) return;
    localStorage.setItem('atajos_principales_' + usuarioInfo.id, JSON.stringify(atajosSeleccionados));
}
function cargarAtajosPrincipales() {
    if (!usuarioInfo || !usuarioInfo.id) return [];
    const data = localStorage.getItem('atajos_principales_' + usuarioInfo.id);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) { return []; }
    }
    return [];
}
function mostrarMinusBtn(btn, idx) {
    const minus = document.createElement('button');
    minus.className = 'atajo-minus-btn';
    minus.innerHTML = '<i class="bx bx-minus"></i>';
    minus.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        quitarAtajo(idx);
        // Eliminado: Si no quedan atajos, desactivar modo eliminar
        // if (atajosSeleccionados.length === 0) {
        //     desactivarModoEliminar();
        // }
    };
    btn.appendChild(minus);
}
function activarModoEliminar() {
    modoEliminar = true;
    const contenedor = document.getElementById('atajos-principales');
    const atajos = contenedor.querySelectorAll('.atajo');

    atajos.forEach((btn, idx) => {
        btn.classList.add('delete');
        mostrarMinusBtn(btn, idx);
    });

    // Agregar listener para desactivar modo eliminar al hacer clic fuera
    setTimeout(() => {
        document.addEventListener('mousedown', desactivarModoEliminar);
        document.addEventListener('touchstart', desactivarModoEliminar);
    }, 100);
}

function desactivarModoEliminar(e) {
    // No desactivar si se hace clic en un botón minus
    if (e && e.target && e.target.closest('.atajo-minus-btn')) {
        return;
    }

    modoEliminar = false;
    const contenedor = document.getElementById('atajos-principales');
    const atajos = contenedor.querySelectorAll('.atajo');

    atajos.forEach(btn => {
        btn.classList.remove('delete');
        const minusBtn = btn.querySelector('.atajo-minus-btn');
        if (minusBtn) {
            minusBtn.remove();
        }
    });

    // Remover listeners
    document.removeEventListener('mousedown', desactivarModoEliminar);
    document.removeEventListener('touchstart', desactivarModoEliminar);
}

function agregarAtajo(atajo, index) {
    if (atajosSeleccionados.some(a => a.texto === atajo.texto)) return;
    if (index == null || index > atajosSeleccionados.length) index = atajosSeleccionados.length;
    atajosSeleccionados.splice(index, 0, atajo);
    renderAtajosPrincipales();
    guardarAtajosPrincipales();
    ocultarAtajosAll();

    const contenedor = document.getElementById('atajos-principales');
    const btns = contenedor.querySelectorAll('.atajo');
    if (btns[index]) btns[index].classList.add('agregando');
    setTimeout(() => {
        if (btns[index]) btns[index].classList.remove('agregando');
    }, 200);

}
function quitarAtajo(index) {
    atajosSeleccionados.splice(index, 1);
    renderAtajosPrincipales();
    guardarAtajosPrincipales();
    desactivarModoEliminar(); // Desactiva modo eliminar siempre que se quite un atajo
}
function renderAtajosAll() {
    const contenedor = document.getElementById('atajos-todos');
    contenedor.innerHTML = '';

    const rolUsuario = usuarioInfo.rol;

    if (rolUsuario === 'Administración') {
        // Para administradores, mostrar todos los atajos disponibles en una lista plana
        Object.values(atajosPorRol).flat().forEach((atajo) => {
            // No mostrar los ya seleccionados
            if (atajosSeleccionados.some(a => a.texto === atajo.texto)) return;

            const btn = document.createElement('button');
            btn.className = 'atajo';
            btn.innerHTML = `<i class='fa ${atajo.icono}'></i><p>${atajo.texto}</p>`;
            btn.onclick = () => agregarAtajo(atajo, atajoAgregarIndex);
            contenedor.appendChild(btn);
        });
    } else {
        // Para otros roles, mostrar solo sus atajos
        const atajosRol = atajosPorRol[rolUsuario] || [];
        atajosRol.forEach((atajo) => {
            // No mostrar los ya seleccionados
            if (atajosSeleccionados.some(a => a.texto === atajo.texto)) return;

            const btn = document.createElement('button');
            btn.className = 'atajo';
            btn.innerHTML = `<i class='fa ${atajo.icono}'></i><p>${atajo.texto}</p>`;
            btn.onclick = () => agregarAtajo(atajo, atajoAgregarIndex);
            contenedor.appendChild(btn);
        });

        if (usuarioInfo.plugins) {
            const pluginsArray = usuarioInfo.plugins.split(',');
            pluginsArray.forEach(plugin => {
                const pluginTrim = plugin.trim();
                if (pluginsMenu[pluginTrim]) {
                    const pluginData = pluginsMenu[pluginTrim];
                    // No mostrar si ya está seleccionado
                    if (atajosSeleccionados.some(a => a.texto === pluginData.texto)) return;

                    const btn = document.createElement('button');
                    btn.className = 'atajo';
                    btn.innerHTML = `<i class='fa ${pluginData.icono}'></i><p>${pluginData.texto}</p>`;
                    btn.onclick = () => agregarAtajo(pluginData, atajoAgregarIndex);
                    contenedor.appendChild(btn);
                }
            });
        }
    }
}
export function cargarAtajos() {
    atajosSeleccionados = cargarAtajosPrincipales()
    renderAtajosPrincipales();
}


export function mostrarAtajoAll() {
    renderAtajosAll();
    const atajosAllContainer = document.querySelector('.atajos-all')
    if (atajosAllContainer.classList.contains('activo')) {
        ocultarNotificaciones();
    } else {
        atajosAllContainer.classList.add('activo');
        mostrarOverlay();
    }

}
export function ocultarAtajosAll() {
    ocultarOverlay();
    const atajosAllContainer = document.querySelector('.atajos-all')
    atajosAllContainer.classList.remove('activo')
}