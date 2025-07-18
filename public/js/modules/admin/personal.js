import {pluginsMenu} from "../../dashboard.js";
let personal = [];

const DB_NAME = 'damabrava_db';
const PERSONAL_DB = 'personal';

async function obtenerPersonal() {
    try {
        
        const personalCache = await obtenerLocal(PERSONAL_DB, DB_NAME);

        if (personalCache.length > 0) {
            personal = personalCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }
            try {
                
                const response = await fetch('/obtener-personal');
                const data = await response.json();

                if (data.success) {
                    personal = data.personal.sort((a, b) => {
                        const idA = parseInt(a.id.split('-')[1]);
                        const idB = parseInt(b.id.split('-')[1]);
                        return idB - idA;
                    });

                    if (JSON.stringify(personalCache) !== JSON.stringify(personal)) {
                        console.log('Diferencias encontradas, actualizando UI');
                        updateHTMLWithData();
                        (async () => {
                        try {
                            const db = await initDB(PERSONAL_DB, DB_NAME);
                            const tx = db.transaction(PERSONAL_DB, 'readwrite');
                            const store = tx.objectStore(PERSONAL_DB);
        
                            // Limpiar todos los registros existentes
                            await store.clear();
        
                            // Guardar los nuevos registros
                            for (const item of personal) {
                                await store.put({
                                    id: item.id,
                                    data: item,
                                    timestamp: Date.now()
                                });
                            }
        
                            console.log('Caché actualizado correctamente');
                        } catch (error) {
                            console.error('Error actualizando el caché:', error);
                        }})();
                    }
                    else{
                        console.log('no son diferentes')
                    }

                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                throw error;
            }
    } catch (error) {
        console.error('Error al obtener personal:', error);
        return false;
    }
}
export async function mostrarPersonal() {
    renderInitialHTML();
    const [personal] = await Promise.all([
        await obtenerPersonal()
    ]);
}
function renderInitialHTML() {

    const view = document.querySelector('.personal-cont');
    const initialHTML = `
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Personal</p>
                </div>
            </div>
            <div class="buscador-view">
                <button class="lupa"><i class='bx bx-search'></i></button>
                <input type="text" class="search" placeholder="Buscar...">
                <button class="limpiar-search"><i class='bx bx-x'></i></button>
            </div>
        </div>
        <div class="contenido-view">
        ${Array(10).fill().map(() => `
            <div class="skeleton-producto">
                <div class="skeleton-header">
                    <div class="skeleton skeleton-img"></div>
                    <div class="skeleton-content">
                        <div class="skeleton skeleton-line"></div>
                        <div class="skeleton skeleton-line"></div>
                        <div class="skeleton skeleton-line"></div>
                    </div>
                </div>
            </div>
        `).join('')}
        </div>
    `;
    view.innerHTML = initialHTML;
}
function updateHTMLWithData() {

    const productosContainer = document.querySelector('.personal-cont .contenido-view');
    const productosHTML = personal.map(persona => `
        <div class="item-view" data-id="${persona.id}">
            <div class="header-view">
                <i class='bx bx-id-card'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${persona.id}</span><span class="flotante-view ${persona.rol === 'gray' ? 'red' : 'blue'} ">${persona.rol ? persona.rol : 'Sin rol'}</span></span>
                    <span class="detalle"><strong>${persona.nombre}</strong></span>
                    <span class="pie">${persona.email}<span class="punto-referencia">${persona.estado === 'Activo' ? `<i class="ri-checkbox-blank-circle-fill" style="color:var(--exito) !important; font-size:10px; max-width:10px; height:10px; background: none; justify-content:flex-end"></i>` : `<i class="ri-checkbox-blank-circle-fill" style="color:red !important;font-size:10px; max-width:10px; height:10px; background: none; justify-content:flex-end"></i>`}</span></span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosPersonal();
}


function eventosPersonal() {
    const inputBusqueda = document.querySelector('.search');
    const btnLimpiar = document.querySelector('.limpiar-search');
    const items = document.querySelectorAll('.item-view');

    // Función para mostrar/ocultar botón limpiar
    function toggleLimpiarBtn() {
        if (inputBusqueda.value.trim() !== '') {
            btnLimpiar.style.display = 'block';
        } else {
            btnLimpiar.style.display = 'none';
        }
    }

    // Mostrar/ocultar botón limpiar al cargar
    toggleLimpiarBtn();

    items.forEach(item => {
        item.addEventListener('click', function () {
            const proovedorId = this.dataset.id;
            window.info(proovedorId);
        });
    });

    // Evento para el botón limpiar
    btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.focus();
        toggleLimpiarBtn();
        aplicarFiltros();
    });

    inputBusqueda.addEventListener('input', (e) => {
        toggleLimpiarBtn();
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });
    function aplicarFiltros() {
        const busqueda = normalizarTexto(inputBusqueda.value);

        setTimeout(() => {
            let hayResultados = false;

            items.forEach(item => {
                const proovedor = personal.find(c => c.id === item.dataset.id);
                const coincide = proovedor && (
                    normalizarTexto(proovedor.nombre).includes(busqueda) ||
                    normalizarTexto(proovedor.telefono).includes(busqueda) ||
                    normalizarTexto(proovedor.direccion).includes(busqueda) ||
                    normalizarTexto(proovedor.zona).includes(busqueda)
                );

                item.style.display = coincide ? 'flex' : 'none';
                if (coincide) hayResultados = true;
            });
        }, 200);
    }

    window.info = function (userId) {
        const usuario = personal.find(u => u.id === userId);
        if (!usuario) return;

        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">${usuario.nombre}</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-guardar btn blue" style="max-width:100px" data-id="${usuario.id}"><i class='bx bx-edit'></i>Guardar</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <div class="campo-vertical">
                    <p class="titulo-campo">Información del usuario</p>
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span><span>${usuario.id}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-user'></i> Nombre: </span><span>${usuario.nombre}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-phone'></i> Teléfono: </span><span>${usuario.telefono}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-envelope'></i> Email: </span><span>${usuario.email}</span></div>
                </div>
    
                <p class="subtitulo">Configuraciones de usuario</p>
                    <div class="entrada">
                        <i class='bx bx-toggle-left'></i>
                        <div class="input">
                            <p class="detalle">Estado</p>
                            <select class="estado-usuario">
                                <option value="Activo" ${usuario.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                                <option value="Inactivo" ${usuario.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                                <option value="Pendiente" ${usuario.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            </select>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-user-circle'></i>
                        <div class="input">
                            <p class="detalle">Rol</p>
                            <select class="rol-usuario">
                                <option value="Sin rol" ${usuario.rol === 'Sin rol' ? 'selected' : ''}>Sin rol</option> 
                                <option value="Administración" ${usuario.rol === 'Administración' ? 'selected' : ''}>Administración</option>
                                <option value="Almacen" ${usuario.rol === 'Almacen' ? 'selected' : ''}>Almacén</option>
                                <option value="Acopio" ${usuario.rol === 'Acopio' ? 'selected' : ''}>Acopio</option>
                                <option value="Producción" ${usuario.rol === 'Producción' ? 'selected' : ''}>Producción</option>
                            </select>
                        </div>
                    </div>
                    ${usuario.rol != 'Administración' ? `
                <p class="subtitulo">Permisos concedidos</p>
                <div class="permisos-container">
                    <div class="campo-horizontal">
                        <label class="eliminacion">
                            <input type="checkbox" value="eliminacion" ${usuario.permisos?.includes('eliminacion') ? 'checked' : ''}>
                            <span>Eliminación</span>
                        </label>
                        <label class="edicion">
                            <input type="checkbox" value="edicion" ${usuario.permisos?.includes('edicion') ? 'checked' : ''}>
                            <span>Edición</span>
                        </label>
                    </div>
                    <div class="campo-horizontal">
                        <label class="anulacion">
                            <input type="checkbox" value="anulacion" ${usuario.permisos?.includes('anulacion') ? 'checked' : ''}>
                            <span>Anulación</span>
                        </label>
                        <label class="creacion">
                            <input type="checkbox" value="creacion" ${usuario.permisos?.includes('creacion') ? 'checked' : ''}>
                            <span>Creación</span>
                        </label>
                    </div>
                </div>
                <p class="subtitulo">Plugins habilitados</p>
                <div class="plugins-container">
                    ${Object.entries(pluginsMenu).map(([key, plugin]) => `
                        <label class="plugin">
                            <input type="checkbox" value="${key}" ${usuario.plugins?.includes(key) ? 'checked' : ''}>
                            <span>${plugin.texto}</span>
                        </label>
                    `).join('')}
                </div> ` : ''}
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        // Eventos
        const btnGuardar = contenido.querySelector('.btn-guardar');

        btnGuardar.addEventListener('click', async () => {
            const estado = contenido.querySelector('.estado-usuario').value;
            const rol = contenido.querySelector('.rol-usuario').value;
            const pluginsSeleccionados = Array.from(contenido.querySelectorAll('.plugins-container input:checked'))
                .map(cb => cb.value)
                .join(',');
            const permisosSeleccionados = Array.from(contenido.querySelectorAll('.permisos-container input:checked'))
                .map(cb => cb.value)
                .join(',');

            try {
                mostrarCarga();
                const response = await fetch(`/actualizar-usuario-admin/${usuario.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        estado,
                        rol,
                        plugins: pluginsSeleccionados,
                        permisos: permisosSeleccionados
                    })
                });

                if (response.ok) {
                    await obtenerPersonal();
                    info(userId);
                    updateHTMLWithData();
                    mostrarNotificacion('Se actualizo el usuario', {tipo: 'exito', duracion:2000})
                } else {
                    mostrarNotificacion('Error al actaulizar el usuario', {tipo: 'error'})
                    throw new Error('Error al actualizar el usuario');
                }
            } catch (error) {
                mostrarNotificacion('Error al actaulizar el usuario', {tipo: 'error'})
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });
    };
}