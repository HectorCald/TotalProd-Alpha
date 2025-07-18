let proveedores = [];

const DB_NAME = 'damabrava_db';
const PROVEEDOR_DB = 'proveedores';

async function obtenerProveedores() {
    console.log('obteniendo proovedores')
    try {

        const proveedoresCache = await obtenerLocal(PROVEEDOR_DB, DB_NAME);

        if (proveedoresCache.length > 0) {
            proveedores = proveedoresCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }

            try {

                const response = await fetch('/obtener-proovedores');
                const data = await response.json();

                if (data.success) {
                    proveedores = data.proovedores.sort((a, b) => {
                        const idA = parseInt(a.id.split('-')[1]);
                        const idB = parseInt(b.id.split('-')[1]);
                        return idB - idA;
                    });

                    if (JSON.stringify(proveedoresCache) !== JSON.stringify(proveedores)) {
                        console.log('Diferencias encontradas, actualizando UI');
                        updateHTMLWithData();

                        (async () => {
                        try {
                            const db = await initDB(PROVEEDOR_DB, DB_NAME);
                            const tx = db.transaction(PROVEEDOR_DB, 'readwrite');
                            const store = tx.objectStore(PROVEEDOR_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of proveedores) {
                                await store.put({
                                    id: item.id,
                                    data: item,
                                    timestamp: Date.now()
                                });
                            }

                            console.log('Caché actualizado correctamente');
                        } catch (error) {
                            console.error('Error actualizando el caché:', error);
                        }  })();
                    }
                    else {
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
        console.error('Error al obtener proveedores:', error);
        return false;
    }
}

export async function mostrarProveedores() {
    renderInitialHTML();
    const [proovedores] = await Promise.all([
        await obtenerProveedores()
    ]);
}
function renderInitialHTML() {

    const view = document.querySelector('.proveedores-cont');
    const initialHTML = `
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Tus proveedores</p>
                </div>
                <div class="botones-container">
                    <button class="btn-añadir btn trans"><i class='bx bx-user-plus'></i></button>
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
    const productosContainer = document.querySelector('.proveedores-cont .contenido-view');
    const productosHTML = proveedores.map(proveedor => `
        <div class="item-view" data-id="${proveedor.id}">
            <div class="header-view">
                <i class='bx bx-id-card'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${proveedor.id}</span><span class="flotante-view neutro">${proveedor.zona ? proveedor.zona : 'No tiene zona'}</span></span>
                    <span class="detalle"><strong>${proveedor.nombre}</strong></span>
                    <span class="pie">${proveedor.telefono}-${proveedor.direccion ? proveedor.direccion : 'No tiene dirección'}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosProovedores();
}


function eventosProovedores() {
    const inputBusqueda = document.querySelector('.search');
    const btnLimpiar = document.querySelector('.limpiar-search');
    const items = document.querySelectorAll('.item-view');
    const btnAñadir = document.querySelector('.btn-añadir')

    btnAñadir.addEventListener('click', () => {
        crearProveedor();
    })

    // Función para mostrar/ocultar botón limpiar
    function toggleLimpiarBtn() {
        if (inputBusqueda.value.trim() !== '') {
            btnLimpiar.style.display = 'block';
        } else {
            btnLimpiar.style.display = 'none';
        }
    }

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
                const proovedor = proveedores.find(c => c.id === item.dataset.id);
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


    window.info = function (proovedorId) {
        const proovedor = proveedores.find(r => r.id === proovedorId);
        if (!proovedor) return;

        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">${proovedor.nombre}</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-editar btn blue" style="max-width:40px" data-id="${proovedor.id}"><i class='bx bx-edit'></i></button>
                        <button class="btn-eliminar btn red" style="max-width:40px" data-id="${proovedor.id}"><i class="bx bx-trash"></i></button>
                        <button class="btn-historial btn orange" style="max-width:40px" data-id="${proovedor.id}"><i class="bx bx-history"></i></button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <div class="campo-vertical">
                    <p class="titulo-campo">Información del proveedor</p>
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id:</span><span>${proovedor.id}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-phone'></i> Teléfono: </span><span>${proovedor.telefono || 'No registrado'}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-map'></i> Dirección: </span><span>${proovedor.direccion || 'No registrado'}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-map-pin'></i> Zona: </span><span>${proovedor.zona || 'No registrado'}</span></div>
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        const btnEditar = contenido.querySelector('.btn-editar');
        const btnEliminar = contenido.querySelector('.btn-eliminar');
        const btnHistorial = contenido.querySelector('.btn-historial');

        btnEditar.addEventListener('click', () => editar(proovedor));
        btnEliminar.addEventListener('click', () => eliminar(proovedor));
        btnHistorial.addEventListener('click', () => verHistorial(proovedor));

        async function eliminar(proovedor) {

            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Eliminar proveedor</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-eliminar-proovedor-confirmar btn red"><i class="bx bx-trash"></i> Eliminar</button>
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <p class="subtitulo">Información del proovedor</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span><span>${proovedor.id}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-user'></i> Nombre: </span><span>${proovedor.nombre}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-phone'></i> Teléfono: </span><span>${proovedor.telefono || 'No registrado'}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-map'></i> Dirección: </span><span>${proovedor.direccion || 'No registrada'}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-map-pin'></i> Zona: </span><span>${proovedor.zona || 'No registrada'}</span></div>
                    </div>
                    <p class="subtitulo">Motivo de la eliminación</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Vas a eliminar un proovedor del sistema. Esta acción no se puede deshacer y podría afectar a varios registros relacionados. Asegúrate de que deseas continuar.</p>
                        </div>
                    </div>
                </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen2();


            const btnEliminarProovedor = contenido.querySelector('.btn-eliminar-proovedor-confirmar');
            btnEliminarProovedor.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la eliminación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/eliminar-proovedor/${proovedorId}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerProveedores();
                        updateHTMLWithData();
                        ocultarScreen();
                        mostrarNotificacion('Se elimino el proveedor', {tipo: 'exito', duracion:2000})
                    } else {
                        mostrarNotificacion('Error al eliminar el proveedor', {tipo: 'error'})
                        throw new Error('Error al eliminar el proovedor');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al eliminar el proveedor', {tipo: 'error'})
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function editar(proovedor) {

            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Editar proveedor</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-guardar-proovedor btn blue"><i class="bx bx-save"></i> Guardar</button>
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <p class="subtitulo">Información del cliente</p>
                    <div class="entrada">
                        <i class='bx bx-user'></i>
                        <div class="input">
                            <p class="detalle">Nombre</p>
                            <input class="editar-nombre" type="text" value="${proovedor.nombre}" required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-phone'></i>
                        <div class="input">
                            <p class="detalle">Teléfono</p>
                            <input class="editar-telefono" type="text" value="${proovedor.telefono || ''}">
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-map'></i>
                        <div class="input">
                            <p class="detalle">Dirección</p>
                            <input class="editar-direccion" type="text" value="${proovedor.direccion || ''}">
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-map-pin'></i>
                        <div class="input">
                            <p class="detalle">Zona</p>
                            <input class="editar-zona" type="text" value="${proovedor.zona || ''}">
                        </div>
                    </div>
                    <p class="subtitulo">Motivo de la edición</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por editar un proovedor del sistema. Asegúrate de realizar los cambios correctamente, ya que podrían modificar información relacionada.</p>
                        </div>
                    </div>

                </div>
            `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen2();

            const btnGuardarProveedor = contenido.querySelector('.btn-guardar-proovedor');
            btnGuardarProveedor.addEventListener('click', async () => {
                const nombre = document.querySelector('.editar-nombre').value.trim();
                const telefono = document.querySelector('.editar-telefono').value.trim();
                const direccion = document.querySelector('.editar-direccion').value.trim();
                const zona = document.querySelector('.editar-zona').value.trim();
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresar el motivo de la edición')
                    return;
                }
                if (!nombre) {
                    mostrarNotificacion('Ingresa por lo menos el nombre')
                    return;
                }
                try {
                    mostrarCarga();
                    const response = await fetch(`/editar-proovedor/${proovedorId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nombre, telefono, direccion, zona, motivo })
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerProveedores();
                        updateHTMLWithData();
                        info(proovedorId);
                        mostrarNotificacion('Se actualizo el proveedor', {tipo:'exito', duracion:2000})
                    } else {
                        mostrarNotificacion('Error al actualizar el proovedor', {tipo:'error'})
                        throw new Error('Error al actualizar el proovedor');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al actualizar el proovedor', {tipo:'error'})
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function verHistorial(proovedor) {
            ocultarAnuncioSecond();
            mostrarMovimientosAlmacen(proovedor.nombre);
        }
    }
    async function crearProveedor() {
        const contenido = document.querySelector('.screen2');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Nuevo proveedor</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-guardar-nuevo-proovedor btn trans"><i class="bx bx-save"></i> Añadir</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información del proveedor</p>
                <div class="entrada">
                    <i class='bx bx-user'></i>
                    <div class="input">
                        <p class="detalle">Nombre</p>
                        <input class="nuevo-nombre" type="text" required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-phone'></i>
                    <div class="input">
                        <p class="detalle">Teléfono</p>
                        <input class="nuevo-telefono" type="text">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-map'></i>
                    <div class="input">
                        <p class="detalle">Dirección</p>
                        <input class="nuevo-direccion" type="text">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-map-pin'></i>
                    <div class="input">
                        <p class="detalle">Zona</p>
                        <input class="nuevo-zona" type="text">
                    </div>
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen2();

        const btnGuardarNuevoProovedor = contenido.querySelector('.btn-guardar-nuevo-proovedor');
        btnGuardarNuevoProovedor.addEventListener('click', async () => {
            const nombre = document.querySelector('.nuevo-nombre').value.trim();
            const telefono = document.querySelector('.nuevo-telefono').value.trim();
            const direccion = document.querySelector('.nuevo-direccion').value.trim();
            const zona = document.querySelector('.nuevo-zona').value.trim();

            if (!nombre) {
                mostrarNotificacion('Ingresa el nombre del proveedor')
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch('/agregar-proovedor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre, telefono, direccion, zona })
                });
                const data = await response.json();
                if (data.success) {
                    await obtenerProveedores();
                    info(data.id);
                    updateHTMLWithData();
                    mostrarNotificacion('Se creado un nuevo proveedor', {tipo:'exito', duracion:2000})
                } else {
                    mostrarNotificacion('Error al crear el proveedor', {tipo:'error'})
                    throw new Error('Error al crear el proovedor');
                }
            } catch (error) {
                mostrarNotificacion('Error al crear el proveedor', {tipo:'error'})
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });
    }
}
