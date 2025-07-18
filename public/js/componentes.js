export async function initDB(STORE, DB) {
    const ALL_STORES = [
        'prductos_alm',
        'pedidos_acopio',
        'precios_alm',
        'etiquetas_almacen',
        'etiquetas_acopio',
        'clientes',
        'proveedores',
        'nombres_usuarios',
        'ordenes_produccion',
        'registros_acopio',
        'tareas_acopio',
        'registros_tareas_acopio',
        'tareas_acopio',
        'etiquetas_web',
        'precios_alm',
        'precios_web',
        'pagos',
        'personal',
        'productos_acopio',
        'registros_almacen',
        'registros-conteo',
    ];
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB, 1); // Siempre usa versión 1

        request.onerror = () => reject(request.error);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            ALL_STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
    });
}
export async function obtenerLocal(STORE, DB) {
    try {
        const db = await initDB(STORE, DB);
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const items = request.result.map(item => item.data);
                resolve(items);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error obtener desde el cache', error);
        return [];
    }
}


export function normalizarTexto(texto) {
    return (texto || '').toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_\s]+/g, '');
}


export function mostrarScreen() {
    const screen = document.querySelector('.screen')
    screen.classList.add('open')
    configuracionesEntrada()
    ocultarScreen2();
}
export function ocultarScreen() {
    const screen = document.querySelector('.screen')
    screen.classList.remove('open')
    ocultarScreen2();
}
export function mostrarScreen2() {
    const screen = document.querySelector('.screen2')
    screen.classList.add('open')
    configuracionesEntrada()
}
export function ocultarScreen2() {
    const screen = document.querySelector('.screen2')
    screen.classList.remove('open')
}

export function mostrarCarga() {
    const cargaContainer = document.querySelector('.carga')
    cargaContainer.classList.add('activo')
}
export function ocultarCarga() {
    const cargaContainer = document.querySelector('.carga')
    cargaContainer.classList.remove('activo')
}

export function mostrarCargaObtener() {
    const cargaContainer = document.querySelector('.carga-obtener')
    cargaContainer.classList.add('activo')
}
export function ocultarCargaObtener() {
    const cargaContainer = document.querySelector('.carga-obtener')
    cargaContainer.classList.remove('activo')
}



export function configuracionesEntrada() {
    const inputs = document.querySelectorAll('.entrada .input input, .entrada .input select');

    inputs.forEach(input => {
        const label = input.previousElementSibling;

        // Verificar el estado inicial
        if (input.value.trim() !== '') {
            label.style.transform = 'translateY(-75%) scale(0.85)';
            label.style.color = 'var(--cuarto)';
            label.style.fontWeight = '600';
            label.style.zIndex = '5';
        }

        input.addEventListener('focus', () => {
            label.style.transform = 'translateY(-75%) scale(0.85)';
            label.style.color = 'var(--cuarto)';
            label.style.fontWeight = '600';
            label.style.zIndex = '5';
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

}

export function mostrarNotificacion(mensaje, opciones = {}) {
    const { tipo = 'info', duracion = 4000 } = opciones;
    let contenedor = document.querySelector('.notificaciones-flotantes');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.className = 'notificaciones-flotantes';
        document.body.appendChild(contenedor);
    }
    // Selección de ícono y color
    let icono = 'bxs-info-circle', color = 'var(--warning)';
    if (tipo === 'exito') { icono = 'bxs-check-circle'; color = 'var(--exito)'; }
    if (tipo === 'error') { icono = 'bxs-error-circle'; color = 'var(--error)'; }
    // Notificación con ícono
    const noti = document.createElement('div');
    noti.className = `notificacion ${tipo}`;
    noti.innerHTML = `
        <i class='bx ${icono} icono-noti' style="color:${color}"></i>
        <span class="mensaje">${mensaje}</span>
        <button class="cerrar-noti" title="Cerrar">&times;</button>
    `;
    noti.querySelector('.cerrar-noti').onclick = () => noti.remove();
    if (duracion > 0) setTimeout(() => noti.remove(), duracion);
    contenedor.appendChild(noti);
}


const permisos = {
    creacion: false,
    eliminacion: false,
    edicion: false,
    anulacion: false
};
export function actualizarPermisos(recuperar) {
    const usuario = recuperar;
    if (!usuario) return;

    permisos.creacion = usuario.rol === 'Administración' || usuario.permisos?.includes('creacion');
    permisos.eliminacion = usuario.rol === 'Administración' || usuario.permisos?.includes('eliminacion');
    permisos.edicion = usuario.rol === 'Administración' || usuario.permisos?.includes('edicion');
    permisos.anulacion = usuario.rol === 'Administración' || usuario.permisos?.includes('anulacion');
}
export function tienePermiso(tipo) {
    return permisos[tipo] || false;
}