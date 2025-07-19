let clientes = [];

const DB_NAME = 'damabrava_db';
const CLIENTES_DB = 'clientes';

async function obtenerClientes() {
    try {

        const clientesCache = await obtenerLocal(CLIENTES_DB, DB_NAME);

        if (clientesCache.length > 0) {
            clientes = clientesCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }
        try {

            const response = await fetch('/obtener-clientes');
            const data = await response.json();

            if (data.success) {
                clientes = data.clientes.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

                if (JSON.stringify(clientesCache) !== JSON.stringify(clientes)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    updateHTMLWithData();
                    (async () => {
                        try {
                            const db = await initDB(CLIENTES_DB, DB_NAME);
                            const tx = db.transaction(CLIENTES_DB, 'readwrite');
                            const store = tx.objectStore(CLIENTES_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of clientes) {
                                await store.put({
                                    id: item.id,
                                    data: item,
                                    timestamp: Date.now()
                                });
                            }

                            console.log('Caché actualizado correctamente');
                        } catch (error) {
                            console.error('Error actualizando el caché:', error);
                        }
                    })();
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
        console.error('Error al obtener clientes:', error);
        return false;
    }
}

export async function mostrarClientes() {
    renderInitialHTML();
    const [clientes] = await Promise.all([
        await obtenerClientes()
    ]);
}
function renderInitialHTML() {

    const view = document.querySelector('.clientes-cont');
    const initialHTML = `
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Tus clientes</p>
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

    const productosContainer = document.querySelector('.clientes-cont .contenido-view');
    const productosHTML = clientes.map(cliente => `
        <div class="item-view" data-id="${cliente.id}">
            <div class="header-view">
                <i class='bx bx-id-card'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${cliente.id}</span><span class="flotante-view neutro">${cliente.zona ? cliente.zona : 'No tiene zona'}</span></span>
                    <span class="detalle">${cliente.nombre}</span>
                    <span class="pie">${cliente.telefono}-${cliente.direccion ? cliente.direccion : 'No tiene dirección'}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;

    eventosClientes();
}


function eventosClientes() {
    const inputBusqueda = document.querySelector('.search');
    const btnLimpiar = document.querySelector('.limpiar-search');
    const items = document.querySelectorAll('.item-view');
    const btnAñadir = document.querySelector('.btn-añadir')

    btnAñadir.addEventListener('click', () => {
        crearCliente();
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
            const clienteId = this.dataset.id;
            window.info(clienteId);
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
                const cliente = clientes.find(c => c.id === item.dataset.id);
                const coincide = cliente && (
                    normalizarTexto(cliente.nombre).includes(busqueda) ||
                    normalizarTexto(cliente.telefono).includes(busqueda) ||
                    normalizarTexto(cliente.direccion).includes(busqueda) ||
                    normalizarTexto(cliente.zona).includes(busqueda)
                );

                item.style.display = coincide ? 'flex' : 'none';
                if (coincide) hayResultados = true;
            });
        }, 200);
    }
    window.info = function (clienteId) {
        const cliente = clientes.find(r => r.id === clienteId);
        if (!cliente) return;

        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">${cliente.nombre}</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-editar btn blue" style="max-width:40px" data-id="${cliente.id}"><i class='bx bx-edit'></i></button>
                        <button class="btn-eliminar btn red" style="max-width:40px" data-id="${cliente.id}"><i class="bx bx-trash"></i></button>
                        <button class="btn-historial btn orange" style="max-width:40px" data-id="${cliente.id}"><i class="bx bx-history"></i></button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información del cliente</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id:</span><span>${cliente.id}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-phone'></i> Teléfono: </span><span>${cliente.telefono || 'No registrado'}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-map'></i> Dirección: </span><span>${cliente.direccion || 'No registrado'}</span></div>
                    <div class="detalle-campo"><span><i class='bx bx-map-pin'></i> Zona: </span><span>${cliente.zona || 'No registrado'}</span></div>
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        const btnEditar = contenido.querySelector('.btn-editar');
        const btnEliminar = contenido.querySelector('.btn-eliminar');
        const btnHistorial = contenido.querySelector('.btn-historial');

        btnEditar.addEventListener('click', () => editar(cliente));
        btnEliminar.addEventListener('click', () => eliminar(cliente));
        btnHistorial.addEventListener('click', () => verHistorial(cliente));

        async function eliminar(cliente) {

            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Eliminar cliente</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-eliminar-cliente-confirmar btn red"><i class="bx bx-trash"></i> Eliminar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información del cliente</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span><span>${cliente.id}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-user'></i> Nombre: </span><span>${cliente.nombre}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-phone'></i> Teléfono: </span><span>${cliente.telefono || 'No registrado'}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-map'></i> Dirección: </span><span>${cliente.direccion || 'No registrada'}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-map-pin'></i> Zona: </span><span>${cliente.zona || 'No registrada'}</span></div>
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
                            <p>Vas a eliminar un cliente del sistema. Esta acción no se puede deshacer y podría afectar a varios registros relacionados. Asegúrate de que deseas continuar.</p>
                        </div>
                    </div>
                </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            const btnEliminarCliente = contenido.querySelector('.btn-eliminar-cliente-confirmar');
            btnEliminarCliente.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la eliminación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/eliminar-cliente/${clienteId}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerClientes();
                        updateHTMLWithData();
                        ocultarScreen();
                        mostrarNotificacion('Se elimino el cliente', {tipo: 'exito', duracion:2000})
                    } else {
                        mostrarNotificacion('Error al eliminar el cliente', {tipo: 'error'})
                        throw new Error('Error al eliminar el cliente');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al eliminar el cliente', {tipo: 'error'})
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function editar(cliente) {

            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Editar cliente</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-guardar-cliente btn blue"><i class="bx bx-save"></i> Guardar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información del cliente</p>
                    <div class="entrada">
                        <i class='bx bx-user'></i>
                        <div class="input">
                            <p class="detalle">Nombre</p>
                            <input class="editar-nombre" type="text" value="${cliente.nombre}" required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-phone'></i>
                        <div class="input">
                            <p class="detalle">Teléfono</p>
                            <input class="editar-telefono" type="text" value="${cliente.telefono || ''}">
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-map'></i>
                        <div class="input">
                            <p class="detalle">Dirección</p>
                            <input class="editar-direccion" type="text" value="${cliente.direccion || ''}">
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-map-pin'></i>
                        <div class="input">
                            <p class="detalle">Zona</p>
                            <input class="editar-zona" type="text" value="${cliente.zona || ''}">
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

            const btnGuardarCliente = contenido.querySelector('.btn-guardar-cliente');
            btnGuardarCliente.addEventListener('click', async () => {
                const nombre = document.querySelector('.editar-nombre').value.trim();
                const telefono = document.querySelector('.editar-telefono').value.trim();
                const direccion = document.querySelector('.editar-direccion').value.trim();
                const zona = document.querySelector('.editar-zona').value.trim();
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la edición')
                    return;
                }
                if (!nombre) {
                    mostrarNotificacion('Ingresa por lo menos el nombre')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/editar-cliente/${clienteId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nombre, telefono, direccion, zona, motivo })
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerClientes();
                        info(clienteId)
                        updateHTMLWithData();
                        mostrarNotificacion('Se actualizo el cliente', {tipo: 'exito', duracion:2000})
                    } else {
                        mostrarNotificacion('Error al actulizar el cliente', {tipo: 'error'})
                        throw new Error('Error al actualizar el cliente');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al actulizar el cliente', {tipo: 'error'})
                    console.error('Error:', error);
                    
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function verHistorial(cliente) {
            ocultarAnuncioSecond();
            mostrarMovimientosAlmacen(cliente.nombre);
        }
    }
    async function crearCliente() {
        const contenido = document.querySelector('.screen2');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Nuevo cliente</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-guardar-nuevo-cliente btn trans"><i class="bx bx-save"></i> Añadir</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información del cliente</p>
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

        const btnGuardarNuevoCliente = contenido.querySelector('.btn-guardar-nuevo-cliente');
        btnGuardarNuevoCliente.addEventListener('click', async () => {
            const nombre = document.querySelector('.nuevo-nombre').value.trim();
            const telefono = document.querySelector('.nuevo-telefono').value.trim();
            const direccion = document.querySelector('.nuevo-direccion').value.trim();
            const zona = document.querySelector('.nuevo-zona').value.trim();

            if (!nombre) {
                mostrarNotificacion('Ingresar el nombre del cliente')
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch('/agregar-cliente', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre, telefono, direccion, zona })
                });

                const data = await response.json();

                if (data.success) {
                    await obtenerClientes();
                    updateHTMLWithData();
                    info(data.id);
                    mostrarNotificacion('Se ha creado un nuevo cliente', {tipo: 'exito', duration:2000} )
                } else {
                    mostrarNotificacion('Error al crear el cliente', {tipo: 'error'})
                    throw new Error('Error al crear el cliente');
                }
            } catch (error) {
                mostrarNotificacion('Error al crear el cliente', {tipo: 'error'})
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });
    }
}