import { usuarioInfo } from "../../dashboard.js";
let productos = [];
let ordenesGlobal = [];
let nombresUsuariosGlobal = [];

const DB_NAME = 'damabrava_db';
const ORDEN_PRODUCCION_DB = 'ordenes_produccion';
const PRODUCTO_ALM_DB = 'prductos_alm';
const NOMBRES_USUARIOS_DB = 'nombres_usuarios';


async function obtenerOrdenes() {
    try {
        const ordenProduccionCache = await obtenerLocal(ORDEN_PRODUCCION_DB, DB_NAME);

        if (ordenProduccionCache.length > 0) {
            ordenesGlobal = ordenProduccionCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-orden-produccion');
        const data = await response.json();

        if (data.success) {
            // Ordenar de más reciente a más antiguo por ID
            ordenesGlobal = data.ordenes.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            if (ordenesGlobal.length === 0) {
                updateHTMLWithData();
            }

            if (JSON.stringify(ordenProduccionCache) !== JSON.stringify(ordenesGlobal)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(ORDEN_PRODUCCION_DB, DB_NAME);
                        const tx = db.transaction(ORDEN_PRODUCCION_DB, 'readwrite');
                        const store = tx.objectStore(ORDEN_PRODUCCION_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of ordenesGlobal) {
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
        console.error('Error al obtener tareas:', error);
        return false;
    }
}
async function obtenerNombresUsuarios() {
    try {

        const nombresUsuariosCache = await obtenerLocal(NOMBRES_USUARIOS_DB, DB_NAME);

        if (nombresUsuariosCache.length > 0) {
            nombresUsuariosGlobal = nombresUsuariosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-nombres-usuarios');
        const data = await response.json();
        if (data.success) {
            nombresUsuariosGlobal = data.nombres.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(nombresUsuariosCache) !== JSON.stringify(nombresUsuariosGlobal)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(NOMBRES_USUARIOS_DB, DB_NAME);
                        const tx = db.transaction(NOMBRES_USUARIOS_DB, 'readwrite');
                        const store = tx.objectStore(NOMBRES_USUARIOS_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of nombresUsuariosGlobal) {
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
        }
        throw new Error('Error al obtener nombres de usuarios');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion({
            message: 'Error al obtener nombres de usuarios',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}
async function obtenerAlmacenGeneral() {
    try {
        const productosCache = await obtenerLocal(PRODUCTO_ALM_DB, DB_NAME);

        if (productosCache.length > 0) {
            console.log('productoscache')
            productos = productosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('almacen cache')
        }

        try {
            const response = await fetch('/obtener-productos');
            const data = await response.json();
            if (data.success) {
                productos = data.productos.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });
                if (JSON.stringify(productosCache) !== JSON.stringify(productos)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    updateHTMLWithData();
                    (async () => {
                        try {
                            const db = await initDB(PRODUCTO_ALM_DB, DB_NAME);
                            const tx = db.transaction(PRODUCTO_ALM_DB, 'readwrite');
                            const store = tx.objectStore(PRODUCTO_ALM_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of productos) {
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
        console.error('Error al obtener productos:', error);
        return false;
    }
}


export async function mostrarOrdenProduccion() {
    renderInitialHTML();

    const [productos, ordenes, nombres] = await Promise.all([
        obtenerAlmacenGeneral(),
        obtenerNombresUsuarios(),
        await obtenerOrdenes()
    ]);
}
function renderInitialHTML() {
    const view = document.querySelector('.ordenes-cont');
    const initialHTML = `
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Orden producción</p>
                </div>
                <div class="botones-container">
                    ${usuarioInfo.plugins?.includes('ordenProd') || usuarioInfo.rol === 'Administración' ? `
                    <button class="nuevo-registro btn trans"><i class='bx bx-plus'></i></button>`: ''}
                </div>
            </div>
            <div class="buscador-view">
                <button class="lupa"><i class='bx bx-search'></i></button>
                <input type="text" class="search" placeholder="Buscar...">
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
                <button class="limpiar-search" style="right:45px"><i class='bx bx-x'></i></button>
            </div>
            <div class="filtros-view estado">
                <button class="btn-filtro activo">Todos</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Finalizados</button>
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
        <div class="no-encontrado">
            <i class='bx bx-error'></i>
            <p>¡Ups!, No se encontraron resultados segun tu busqueda o filtrado.</p>
        </div>
    `;
    view.innerHTML = initialHTML;
}
function updateHTMLWithData() {
    const productosContainer = document.querySelector('.ordenes-cont .contenido-view');

    // Filtrar las órdenes según el email o rol del usuario
    const ordenesFiltradas = ordenesGlobal.filter(registro => {
        // Si es administrador, ve todas las órdenes
        if (usuarioInfo.rol === 'Administración' || usuarioInfo.rol === 'Almacen') {
            return true;
        }

        // Si el rol es Produccion, solo mostrar órdenes donde el usuario es el destino
        if (usuarioInfo.rol === 'Produccion') {
            return registro.destino === usuarioInfo.email;
        }

        // Para otros roles (Acopio, Almacen, etc), mostrar órdenes donde es destino o coincide la etapa
        return registro.destino === usuarioInfo.email || registro.etapa === usuarioInfo.rol;
    });

    const productosHTML = ordenesFiltradas.map(registro => `
        <div class="item-view" data-id="${registro.id}">
            <div class="header-view">
                <i class='bx bx-task'></i>
                <div class="info-header">
                    <span class="id-flotante">
                        <span class="id">${registro.id}</span>
                        <span class="flotante-view ${registro.etapa === 'Produccion' ? 'red' : registro.etapa === 'Acopio' ? 'orange' : 'blue'}">
                            ${registro.etapa === 'Produccion' ? 'Producción' : registro.etapa === 'Acopio' ? 'Acopio' : 'Almacen'}
                        </span>
                    </span>
                    <span class="detalle"><span>${registro.producto}(${registro.cantidad} Unid.)</span></span>
                    <span class="pie">${registro.fecha_emision}</span>
                </div>
            </div>
        </div>
    `).join('');

    productosContainer.innerHTML = productosHTML || `
        <div class="no-encontrado" style="display:flex; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; height:200px;">
            <i class='bx bx-error'></i>
            <p>No tienes órdenes asignadas.</p>
        </div>
    `;

    eventosOrdenProduccion();
}


function eventosOrdenProduccion() {

    const btnNuevaOrden = document.querySelectorAll('.nuevo-registro');
    const botonesEstado = document.querySelectorAll('.filtros-view.estado .btn-filtro');

    const items = document.querySelectorAll('.item-view');
    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');
    const btnLimpiar = document.querySelector('.limpiar-search');

    let filtroFechaInstance = null;
    let filtroEstadoActual = 'Todos';

    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    function aplicarFiltros() {
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = ordenesGlobal.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Lógica de filtrado existente
            if (filtroEstadoActual && filtroEstadoActual !== 'Todos') {
                if (filtroEstadoActual === 'Pendientes') {
                    mostrar = registroData.hora_fin === null || registroData.hora_fin === '';
                } else if (filtroEstadoActual === 'Finalizados') {
                    mostrar = registroData.hora_fin !== '';
                }
            }

            if (mostrar && fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = registroData.fecha.split('/');
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];

                fechaRegistro.setHours(0, 0, 0, 0);
                fechaInicio.setHours(0, 0, 0, 0);
                fechaFin.setHours(23, 59, 59, 999);

                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }

            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.producto,
                    registroData.fecha,
                ].filter(Boolean).join(' ').toLowerCase();

                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        const registrosVisibles = registrosFiltrados.filter(r => r.mostrar).length;

        // Animación de ocultamiento
        items.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        // Esperar a que termine la animación de ocultamiento
        setTimeout(() => {
            items.forEach(registro => {
                registro.style.display = 'none';
            });

            // Mostrar los filtrados con animación escalonada
            registrosFiltrados.forEach(({ elemento, mostrar }, index) => {
                if (mostrar) {
                    elemento.style.display = 'flex';
                    elemento.style.opacity = '0';
                    elemento.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        elemento.style.opacity = '1';
                        elemento.style.transform = 'translateY(0)';
                    }, 20); // Efecto cascada suave
                }
            });

            // Actualizar mensaje de no encontrado
            if (mensajeNoEncontrado) {
                mensajeNoEncontrado.style.display = registrosVisibles === 0 ? 'flex' : 'none';
            }
        }, 100);
    }
    function toggleLimpiarBtn() {
        if (inputBusqueda.value.trim() !== '') {
            btnLimpiar.style.display = 'block';
        } else {
            btnLimpiar.style.display = 'none';
        }
    }
    botonesEstado.forEach(boton => {
        if (boton.classList.contains('activo')) {
            filtroEstadoActual = boton.textContent.trim();
            aplicarFiltros();
        }
        boton.addEventListener('click', () => {
            botonesEstado.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
            filtroEstadoActual = boton.textContent.trim();
            scrollToCenter(boton, boton.parentElement);
            aplicarFiltros();
        });
    });
    botonCalendario.addEventListener('click', async () => {
        if (!filtroFechaInstance) {
            filtroFechaInstance = flatpickr(botonCalendario, {
                mode: "range",
                dateFormat: "d/m/Y",
                locale: "es",
                rangeSeparator: " hasta ",
                onChange: function (selectedDates) {
                    if (selectedDates.length === 2) {
                        aplicarFiltros();
                        botonCalendario.classList.add('activo');
                    } else if (selectedDates.length <= 1) {
                        botonCalendario.classList.remove('activo');
                    }
                },
                onClose: function (selectedDates) {
                    if (selectedDates.length <= 1) {
                        aplicarFiltros();
                        botonCalendario.classList.remove('activo');
                    }
                }
            });
        }
        filtroFechaInstance.open();
    });
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


    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });
    window.info = async function (registroId) {
        const registro = ordenesGlobal.find(r => r.id === registroId);
        if (!registro) return;

        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Información</p>
                    </div>
                    <div class="botones-container">
                        <!-- Si la orden tiene fecha de registro y es usario admin o tiene el plugin de orden peuden inrgesar a almacen-->
                        ${registro.fechaRegistro && (usuarioInfo.rol === 'Almacen' || usuarioInfo.rol === 'Administración') ? `
                            <button class="btn-Ingresar btn green"><i class='bx bx-store'></i></button>
                            ` : ''}
                        <!-- Si es admin o tiene plugin de orden puende editar y eliminar-->
                            ${tienePermiso('edicion') || usuarioInfo.rol === 'Administración' ? `
                            <button class="btn-editar btn blue"><i class="bx bx-edit"></i></button>` : ''}
                             ${tienePermiso('eliminacion') || usuarioInfo.rol === 'Administración' ? `
                            <button class="btn-eliminar btn red"><i class="bx bx-trash"></i></button>
                            ` : ''}
                        <!-- Si la orden no tiene fecha de materia prima se vera el boton de envio a materia prima si tiene se vera el boton de registrar formulario-->
                        ${!registro.fecha_materiaPrima && registro.etapa === 'Produccion' ? `
                            <button class="btn-materia-prima btn red"><i class='bx bx-send'></i></button>
                             `: registro.fecha_materiaPrima && registro.etapa === 'Produccion'? `<button class="btn-registrar btn green"><i class='bx bx-file-blank'></i></button>` : ''}
                        <!-- Si la orden tiene no tiene fecha de materia prima y el usario es rol prima se vera el boton para entregar materia prima-->
                        ${!registro.fecha_materiaPrima && (usuarioInfo.rol === 'Acopio' || usuarioInfo.rol === 'Administración') && registro.etapa === 'Acopio' ? `
                            <button class="btn-entregar-mp btn green"><i class='bx bx-send'></i></button>
                        `: ''}
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Información General</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> ID: </span>${registro.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha_emision}</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto: </span>${registro.producto}</div>
                    <div class="detalle-campo"><span><i class='bx bx-box'></i> Cantidad: </span>${registro.cantidad} Unidades</div>
                </div>
                <p class="subtitulo">Materia prima</p>
                <div class="campo-vertical">
                ${registro.fecha_materiaPrima ? `
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha de entrega: </span>${registro.fecha_materiaPrima}</div>
                    <div class="detalle-campo"><span><i class="ri-scales-line"></i> Cantidad: </span>${registro.kilos} Kilos</div>
                    <div class="detalle-campo"><span><i class='bx bx-comment'></i> Observaciones: </span>${registro.obs_materiaPrima || 'Sin observaciones'}</div>
                    ` : `<div class="detalle-campo"><span>No hay información de recepción de materia prima todavia.</span></div>`}
                </div>

                <p class="subtitulo">Producción</p>
                <div class="campo-vertical">
                ${registro.fechaRegistro ? `
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha de registro: </span>${registro.fecha_materiaPrima}</div>
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id del registro: </span>${registro.idProduccion}</div>
                    ` : `<div class="detalle-campo"><span>No hay información de registro de producción todavia.</span></div>`}
                </div>

                <p class="subtitulo">Almacen</p>
                <div class="campo-vertical">
                ${registro.fecha_ingreso ? `
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha de registro: </span>${registro.fechaRegistro}</div>
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id del registro: </span>${registro.idIngreso}</div>
                    ` : `<div class="detalle-campo"><span>No hay información de ingreso a almacen todavia.</span></div>`}
                </div>

                <p class="subtitulo">Personal y Observaciones</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-user'></i> Operador: </span>${registro.operador}</div>
                    <div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones: </span>${registro.observaciones || 'Sin observaciones'}</div>
                </div>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();


        const btnEnviarMateria = contenido.querySelector('.btn-materia-prima');
        if (btnEnviarMateria) {
            btnEnviarMateria.addEventListener('click', () => cambioEtapa(registro));
        }

        const btnEditar = contenido.querySelector('.btn-editar');
        if (btnEditar) {
            btnEditar.addEventListener('click', () => editar(registro));
        }

        const btnEliminar = contenido.querySelector('.btn-eliminar');
        if (btnEliminar) {
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }

        const btnEntragaMp = contenido.querySelector('.btn-entregar-mp');
        if (btnEntragaMp) {
            btnEntragaMp.addEventListener('click', () => entregarMP(registro));
        }
        const btnRegistrar = contenido.querySelector('.btn-registrar');
        if (btnRegistrar) {
            btnRegistrar.addEventListener('click', () => registrarProduccion(registro));
        }


        function eliminar(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Eliminar orden</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-eliminar-registro btn red"><i class="bx bx-trash"></i>Eliminar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información General</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> ID: </span>${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha_emision}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto: </span>${registro.producto}</div>
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora Inicio: </span>${registro.operador}</div>
                    </div>
        
                    <p class="subtitulo">Motivo de la eliminación</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo" type="text" required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Vas a eliminar una orden del sistema. Esta acción no se puede deshacer y podría afectar a otros registros relacionados. Asegúrate de que deseas continuar.</p>
                        </div>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            // Agregar evento al botón eliminar
            const btnEliminar = contenido.querySelector('.btn-eliminar-registro');
            btnEliminar.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo').value.trim();
                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la eliminación')
                    return;
                }

                try {
                    mostrarCarga();

                    const response = await fetch(`/eliminar-orden-produccion/${registro.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerOrdenes();
                        updateHTMLWithData();
                        ocultarScreen();
                        mostrarNotificacion('Se elimino la orden', { tipo: 'exito', duracion: 2000 })
                    }

                } catch (error) {
                    mostrarNotificacion('Error al eliminar la orden', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
        function editar(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Editar orden</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-editar-registro btn blue"><i class="bx bx-save"></i> Guardar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información General</p>
                    <div class="entrada">
                        <i class="bx bx-package"></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" autocomplete="off" value="${registro.producto}" placeholder=" " required>
                        </div>
                    </div>
                    <div class="sugerencias" id="productos-list"></div>
                    <div class="entrada">
                        <i class="bx bx-package"></i>
                        <div class="input">
                            <p class="detalle">Cantidad</p>
                            <input class="cantidad" type="number" value="${registro.cantidad}" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <p class="subtitulo">Seleccionar el destino</p>
                    <div class="entrada">
                        <i class='bx bx-user'></i>
                        <div class="input">
                            <p class="detalle">Operador</p>
                            <select class="nombre-operador" required>
                                <option value="${registro.destino}">${registro.operador}</option>
                                ${nombresUsuariosGlobal.map(user => `
                                    <option value="${user.user}">${user.nombre}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
        
                    <p class="subtitulo">Motivo de la edición</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo" type="text" required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por editar un registro del sistema. Asegúrate de realizar los cambios correctamente, ya que podrían modificar información relacionada.</p>
                        </div>
                    </div>

                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            // Configurar eventos para agregar tareas
            const productoInput = document.querySelector('.entrada .producto');
            const sugerenciasList = document.querySelector('#productos-list');

            productoInput.addEventListener('input', (e) => {

                const valor = normalizarTexto(e.target.value);
                sugerenciasList.innerHTML = '';

                if (valor) {
                    const sugerencias = productos.filter(p =>
                        normalizarTexto(p.producto + p.gramos).includes(valor)
                    ).slice(0, 5);

                    if (sugerencias.length) {
                        sugerenciasList.style.display = 'flex';
                        sugerencias.forEach(p => {
                            const div = document.createElement('div');
                            div.classList.add('item');
                            div.textContent = p.producto + ' ' + p.gramos + ' gr';
                            div.onclick = () => {
                                productoInput.value = p.producto + ' ' + p.gramos + ' gr';
                                sugerenciasList.style.display = 'none';
                                window.idPro = p.id;
                                window.gramos = p.gramos;
                            };
                            sugerenciasList.appendChild(div);
                        });
                    }
                } else {
                    sugerenciasList.style.display = 'none';
                }
            });

            // Configurar evento para guardar cambios
            const btnEditar = contenido.querySelector('.btn-editar-registro');
            btnEditar.addEventListener('click', async () => {
                const productoSeleccionado = productoInput.value.trim();
                const cantidadSeleccionada = document.querySelector('.cantidad').value.trim();
                const usuarioSeleccionado = document.querySelector('.nombre-operador').value.trim();
                const selectCantidad = document.querySelector('.nombre-operador');
                const operadorSeleccionado = selectCantidad.options[selectCantidad.selectedIndex].text.trim();
                const motivo = document.querySelector('.motivo').value.trim();
                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la edición')
                    return;
                }

                try {
                    mostrarCarga();


                    const response = await fetch(`/editar-orden-produccion/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idPro: window.idPro,
                            producto: productoSeleccionado,
                            gramos: window.gramos,
                            cantidad: cantidadSeleccionada,
                            destino: usuarioSeleccionado,
                            operador: operadorSeleccionado,
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerOrdenes();
                        info(registro.id)
                        updateHTMLWithData();
                        mostrarNotificacion('Se actualizo la orden', { tipo: 'exito', duracion: 2000 })
                    }
                } catch (error) {
                    mostrarNotificacion('Error al actualizar la orden', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function cambioEtapa(registro) {
            const etapa = registro.etapa === 'Acopio' ? 'Produccion' : 'Acopio';
            try {
                mostrarCarga();
                const response = await fetch(`/cambio-etapa-produccion/${registro.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        etapa: etapa,
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    await obtenerOrdenes();
                    ocultarScreen();
                    updateHTMLWithData();
                    mostrarNotificacion('Se envio la orden a ' + etapa, { tipo: 'exito', duracion: 2000 })
                } else {
                    mostrarNotificacion('Error al enviar la orden', { tipo: 'error' })
                    throw new Error(data.error || 'Error al enviar la orden');
                }
            } catch (error) {
                mostrarNotificacion('Error al marcar como arreglado', { tipo: 'error' })
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        }
        async function rellenarProduccion(registro, id) {
            const etapa = 'Almacen';
            try {
                const response = await fetch(`/rellenar-produccion/${registro.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idRegistro: id,
                        etapa: etapa,
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    
                } else {
                    mostrarNotificacion('Error al enviar la orden', { tipo: 'error' })
                    throw new Error(data.error || 'Error al enviar la orden');
                }
            } catch (error) {
                mostrarNotificacion('Error al marcar como arreglado', { tipo: 'error' })
                console.error('Error:', error);
            }
        }
        function entregarMP(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Entregar materia</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-entregar btn blue"><i class="bx bx-send"></i> Enviar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información General</p>
                    <div class="entrada">
                        <i class="bx bx-package"></i>
                        <div class="input">
                            <p class="detalle">Peso de materia prima</p>
                            <input class="peso" type="number" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="observaciones" type="text" required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás realizar la entrega de materia prima, esta accion no se puede deshacer, asegurate de ingresar la informacion correcta</p>
                        </div>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();


            // Configurar evento para guardar cambios
            const btnEditar = contenido.querySelector('.btn-entregar');
            btnEditar.addEventListener('click', async () => {
                const pesoSeleccionado = document.querySelector('.peso').value.trim();
                const observacionesSeleccionadas = document.querySelector('.observaciones').value.trim();

                if (!pesoSeleccionado) {
                    mostrarNotificacion('Ingresa el peso de la materia prima')
                    return;
                }

                try {
                    mostrarCarga();


                    const response = await fetch(`/entregar-orden-mp/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            peso: pesoSeleccionado,
                            observaciones: observacionesSeleccionadas,
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        cambioEtapa(registro);
                        await obtenerOrdenes();
                        ocultarScreen();
                        updateHTMLWithData();
                        mostrarNotificacion('Se realizo la entrega', { tipo: 'exito', duracion: 2000 })
                    }
                } catch (error) {
                    mostrarNotificacion('Error al realizar la entrega', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
        function registrarProduccion(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Registro</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-registrar-form btn trans"><i class="bx bx-notepad"></i> Registrar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                <p class="subtitulo">Producto</p>
                    <div class="entrada">
                        <i class="bx bx-box"></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" value="${registro.producto}" autocomplete="off" placeholder=" " readonly required>
                        </div>
                    </div>
                    <div class="sugerencias" id="productos-list"></div>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class="ri-scales-line"></i>
                            <div class="input">
                                <p class="detalle">Gramaje</p>
                                <input class="gramaje" type="number" value="${registro.gramaje}" inputmode="numeric" pattern="[0-9]*" placeholder=" " readonly required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-spreadsheet'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                    <p class="subtitulo">Procesos</p>
                    <div class="entrada">
                        <i class='bx bx-git-compare'></i>
                        <div class="input">
                            <p class="detalle">Proceso</p>
                            <select class="proceso" required>
                                <option value="" disabled selected></option>
                                <option value="Cernido">Cernido</option>
                                <option value="Seleccion">Selección</option>
                                <option value="Ninguno">Ninguno</option>
                            </select>
                        </div>
                    </div>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-bowl-hot'></i>
                            <div class="input">
                                <p class="detalle">Microondas</p>
                                <select class="select" required>
                                    <option value="" disabled selected></option>
                                    <option value="Si">Si</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>
                        <div class="entrada" style="display:none">
                            <i class='bx bx-time'></i>
                            <div class="input">
                                <p class="detalle">Tiempo</p>
                                <input class="microondas" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                    <p class="subtitulo">Acabado</p>
                    <div class="entrada">
                        <i class='bx bxs-cube-alt'></i>
                        <div class="input">
                            <p class="detalle">Envases terminados</p>
                            <input class="envasados" type="number" value="${registro.cantidad}" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-calendar'></i>
                        <div class="input">
                            <p class="detalle">Fecha de vencimiento</p>
                            <input class="vencimiento" type="month" placeholder=" " required>
                        </div>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();
            const selectMicroondas = document.querySelector('.select');
            const entradaTiempo = document.querySelector('.microondas').closest('.entrada');
            selectMicroondas.addEventListener('change', () => {
                if (selectMicroondas.value === 'Si') {
                    entradaTiempo.style.display = 'flex';
                    entradaTiempo.querySelector('.microondas').focus();
                } else {
                    entradaTiempo.style.display = 'none';
                }
            });

            const btnRegistrarForm = document.querySelector('.btn-registrar-form');

            btnRegistrarForm.addEventListener('click', () => confirmaRegistro());

            async function confirmaRegistro() {
                // Get all form values
                const producto = registro.producto; // Fixed to use registro.producto
                const idProducto = registro.idProducto;
                const lote = document.querySelector('.entrada .lote').value; // Fixed selector
                const gramos = registro.gramaje; // Fixed to use registro.gramaje
                const proceso = document.querySelector('.proceso').value;
                const microondas = selectMicroondas.value;
                const tiempo = document.querySelector('.microondas').value;
                const envasados = document.querySelector('.envasados').value;
                const vencimiento = document.querySelector('.vencimiento').value;

                // Individual field validations

                if (!lote) {
                    mostrarNotificacion('Ingrese el lote');
                    return;
                }

                if (!proceso) {
                    mostrarNotificacion('Seleccione el proceso de producción');
                    return;
                }

                if (!microondas) {
                    mostrarNotificacion('Seleccione si se usó microondas');
                    return;
                }

                if (microondas === 'Si' && !tiempo) {
                    mostrarNotificacion('Ingrese el tiempo en el microondas');
                    return;
                }

                if (!envasados) {
                    mostrarNotificacion('Ingrese la cantidad de envases');
                    return;
                }

                if (!vencimiento) {
                    mostrarNotificacion('Seleccione la fecha de vencimiento');
                    return;
                }

                // Validate product exists
                const productoExiste = productos.some(p =>
                    normalizarTexto(p.producto) === normalizarTexto(producto)
                );

                if (!productoExiste) {
                    mostrarNotificacion('El producto no existe en el sistema');
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch('/registrar-produccion', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idProducto,
                            producto,
                            lote,
                            gramos,
                            proceso,
                            microondas,
                            tiempo: microondas === 'No' ? 'No' : tiempo,
                            envasados,
                            vencimiento
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await rellenarProduccion(registro, data.data.id);
                        await obtenerOrdenes();
                        ocultarScreen();
                        updateHTMLWithData();
                        mostrarNotificacion('Producción registrada correctamente', { tipo: 'exito', duration: 2000 });
                    } else {
                        throw new Error(data.error || 'Error al registrar la producción');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al registrar la producción', { tipo: 'error' });
                    console.error('Error en registro:', error);
                } finally {
                    ocultarCarga();
                }
            };
        }


    }
    btnNuevaOrden.forEach(btn => {
        btn.addEventListener('click', mostrarFormularioNuevoRegistro);
    })
    function mostrarFormularioNuevoRegistro() {
        const contenido = document.querySelector('.screen');

        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Nueva orden</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-registrar btn green"><i class="bx bx-play-circle"></i> Iniciar</button>
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Seleccionar Producto</p>
                <div class="entrada">
                    <i class="bx bx-package"></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="sugerencias" id="productos-list"></div>
                <div class="entrada">
                    <i class="bx bx-package"></i>
                    <div class="input">
                        <p class="detalle">Cantidad</p>
                        <input class="cantidad" type="number" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <p class="subtitulo">Seleccionar el destino</p>
                <div class="entrada">
                    <i class='bx bx-user'></i>
                    <div class="input">
                        <p class="detalle">Operador</p>
                        <select class="nombre-operador" required>
                            <option value=""></option>
                            ${nombresUsuariosGlobal.map(user => `
                                <option value="${user.user}">${user.nombre}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        const productoInput = document.querySelector('.entrada .producto');
        const sugerenciasList = document.querySelector('#productos-list');

        function normalizarTexto(texto) {
            return texto
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[-\s]+/g, "");
        }

        productoInput.addEventListener('input', (e) => {
            const valor = normalizarTexto(e.target.value);
            sugerenciasList.innerHTML = '';

            if (valor) {
                const sugerencias = productos.filter(p =>
                    normalizarTexto(p.producto + p.gramos).includes(valor)
                ).slice(0, 5);

                if (sugerencias.length) {
                    sugerenciasList.style.display = 'flex';
                    sugerencias.forEach(p => {
                        const div = document.createElement('div');
                        div.classList.add('item');
                        div.textContent = p.producto + ' ' + p.gramos + ' gr';
                        div.onclick = () => {
                            productoInput.value = p.producto + ' ' + p.gramos + ' gr';
                            sugerenciasList.style.display = 'none';
                            window.idPro = p.id;
                            window.gramos = p.gramos;
                        };
                        sugerenciasList.appendChild(div);
                    });
                }
            } else {
                sugerenciasList.style.display = 'none';
            }
        });

        const btnRegistrar = contenido.querySelector('.btn-registrar');
        btnRegistrar.addEventListener('click', async () => {
            try {
                const productoSeleccionado = productoInput.value.trim();
                const cantidadSeleccionada = document.querySelector('.cantidad').value.trim();
                const usuarioSeleccionado = document.querySelector('.nombre-operador').value.trim();
                const selectCantidad = document.querySelector('.nombre-operador');
                const operadorSeleccionado = selectCantidad.options[selectCantidad.selectedIndex].text.trim();



                if (!productoSeleccionado || cantidadSeleccionada === '' || !usuarioSeleccionado) {
                    mostrarNotificacion('Debes completar todos los campos');
                    return;
                }

                mostrarCarga();

                const response = await fetch('/registrar-orden-produccion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idProducto: window.idPro,
                        producto: productoSeleccionado,
                        gramos: window.gramos,
                        cantidad: cantidadSeleccionada,
                        destino: usuarioSeleccionado,
                        operador: operadorSeleccionado,
                    })
                });

                const data = await response.json();

                if (data.success) {
                    await obtenerOrdenes();
                    ocultarScreen();
                    updateHTMLWithData();
                    mostrarNotificacion('Se inicio una nueva orden', { tipo: 'exito', duracion: 2000 })
                } else {
                    throw new Error(data.error);
                }

            } catch (error) {
                mostrarNotificacion('Error al iniciar la orden', { tipo: 'error' })
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });
    }
    aplicarFiltros();
}