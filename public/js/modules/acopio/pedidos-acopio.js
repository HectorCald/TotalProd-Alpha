import { usuarioInfo } from "../../dashboard.js";
let pedidosGlobal = [];
let productos = [];
let proovedoresAcopioGlobal = [];
let mensajeCompras = localStorage.getItem('damabrava_mensaje_compras') || 'Se compro:\n• Sin compras registradas';
let carritoIngresosAcopio = new Map(JSON.parse(localStorage.getItem('damabrava_ingreso_acopio') || '[]'));

const DB_NAME = 'damabrava_db';
const PROVEEDOR_DB = 'proveedores';
const PRODUCTOS_AC_DB = 'productos_acopio';
const PEDIDOS_ACOPIO_DB = 'pedidos_acopio';



async function obtenerProovedoresAcopio() {
    try {
        const proovedoresCache = await obtenerLocal(PROVEEDOR_DB, DB_NAME);

        if (proovedoresCache.length > 0) {
            proovedoresAcopioGlobal = proovedoresCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-proovedores');
        const data = await response.json();

        if (data.success) {
            // Store proovedores in global variable
            proovedoresAcopioGlobal = data.proovedores.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Descending order
            });

            if (JSON.stringify(proovedoresCache) !== JSON.stringify(proovedoresAcopioGlobal)) {
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
                        for (const item of proovedoresAcopioGlobal) {
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
        console.error('Error al obtener proovedores:', error);
        return false;
    }
}
async function obtenerPedidos() {
    try {

        const registrosCachePedidos = await obtenerLocal(PEDIDOS_ACOPIO_DB, DB_NAME);

        // Si hay registros en caché, actualizar la UI inmediatamente
        if (registrosCachePedidos.length > 0) {
            pedidosGlobal = registrosCachePedidos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
        }

        const response = await fetch('/obtener-pedidos');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar de más reciente a más antiguo
            pedidosGlobal = data.pedidos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Orden descendente por número de ID
            });

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(registrosCachePedidos) !== JSON.stringify(pedidosGlobal)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();
            }

            // Actualizar el caché en segundo plano
            (async () => {
                try {
                    const db = await initDB(PEDIDOS_ACOPIO_DB, DB_NAME);
                    const tx = db.transaction(PEDIDOS_ACOPIO_DB, 'readwrite');
                    const store = tx.objectStore(PEDIDOS_ACOPIO_DB);

                    await store.clear();

                    for (const registro of pedidosGlobal) {
                        await store.put({
                            id: registro.id,
                            data: registro,
                            timestamp: Date.now()
                        });
                    }

                    console.log('Caché actualizado correctamente');
                } catch (error) {
                    console.error('Error actualizando el caché:', error);
                }
            })();

            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        return false;
    }
}
async function obtenerAlmacenAcopio() {
    try {
        mostrarCargaObtener();

        const productoAcopioCache = await obtenerLocal(PRODUCTOS_AC_DB, DB_NAME);

        if (productoAcopioCache.length > 0) {
            productos = productoAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-productos-acopio');
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();

        if (data.success) {
            productos = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(productoAcopioCache) !== JSON.stringify(productos)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(PRODUCTOS_AC_DB, DB_NAME);
                        const tx = db.transaction(PRODUCTOS_AC_DB, 'readwrite');
                        const store = tx.objectStore(PRODUCTOS_AC_DB);

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
            throw new Error(data.error || 'Error al obtener los productos');
        }
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return false;
    } finally {
        ocultarCargaObtener();
    }
}

export async function mostrarPedidos() {
    renderInitialHTML();

    const [registrosPedidos, registrosProovedores] = await Promise.all([
        obtenerProovedoresAcopio(),
        await obtenerPedidos(),
    ]);
}
function renderInitialHTML() {

    const view = document.querySelector('.pedidos-acopio-cont');
    const initialHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <p class="titulo">Pedidos acopio</p>
                    </div>
                    <div class="botones-container">
                        <button class="nuevo-pedido btn blue"><i class='bx bx-plus'></i> Nuevo</button>
                    </div>
                </div>
                <div class="buscador-view">
                    <button class="lupa"><i class='bx bx-search'></i></button>
                    <input type="text" class="search" placeholder="Buscar...">
                    <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
                    <button class="limpiar-search" style="right:45px"><i class='bx bx-x'></i></button>
                </div>
                
                <div class="filtros-view estado">
                    <button class="btn-filtro activado">Todos</button>
                    <button class="btn-filtro">Pendientes</button>
                    <button class="btn-filtro">Recibidos</button>
                    <button class="btn-filtro">Ingresados</button>
                    <button class="btn-filtro">Rechazados</button>
                    <button class="btn-filtro">No llegaron</button>
                </div>
            </div>
            
            <div class="contenido-view" style="padding-bottom:50px">
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
            <button class="mensaje btn-fill green" style="position: fixed; bottom:10px; left:50%;transform: translateX(-50%); z-index:5;width:calc(100% - 20px)" onclick="mostrarMensajeCompras()"><i class="fas fa-comment"></i>Compras registradas</button>
    `;
    view.innerHTML = initialHTML;
}
function updateHTMLWithData() {
    const productosContainer = document.querySelector('.pedidos-acopio-cont .contenido-view');
    const productosHTML = pedidosGlobal.map(pedido => `
        <div class="item-view" data-id="${pedido.id}">
            <div class="header-view">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${pedido.id}</span><span class="flotante-view ${pedido.estado === 'Recibido' ? 'blue' : pedido.estado === 'Ingresado' ? 'green' : pedido.estado === 'Pendiente' ? 'gray' : pedido.estado === 'No llego' ? 'orange' : pedido.estado === 'Rechazado' ? 'red' : ''} ">${pedido.estado}</span></span>
                    <span class="detalle">
                        <span>${pedido.producto}</span>
                        ${pedido.estado.toLowerCase() === 'pendiente' ?
            `<span class="cantidad-pedida">(${pedido.cantidadPedida})</span>` :
            pedido.estado.toLowerCase() === 'recibido' ?
                `<span class="cantidad-pedida">(${pedido.cantidadEntregadaUnd || 'No registrado'})</span>` :
                pedido.estado.toLowerCase() === 'ingresado' ?
                    `<span class="cantidad-pedida">(${pedido.cantidadIngresada || 'No registrado'} Kg.) </span>` :
                    pedido.estado.toLowerCase() === 'no llego' ?
                        `<span class="cantidad-pedida">(${pedido.cantidadEntregadaUnd || 'No registrado'}) </span>` : ''
        }
                    </span>
                    <span class="pie" data-fecha="${pedido.estado === 'Pendiente' ? pedido.fecha : pedido.estado === 'Recibido' ? pedido.fechaEntrega : pedido.estado === 'Ingresado' ? pedido.fechaIngreso : ''}">${pedido.estado === 'Pendiente' ? pedido.fecha : pedido.estado === 'Recibido' ? pedido.fechaEntrega : pedido.estado === 'Ingresado' ? pedido.fechaIngreso : ''}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosPedidos();
}


function eventosPedidos() {
    const btnNuevoPedido = document.querySelector('.nuevo-pedido');
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

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = pedidosGlobal.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            if (filtroEstadoActual && filtroEstadoActual !== 'Todos') {
                if (filtroEstadoActual === 'Pendientes') {
                    mostrar = registroData.estado === 'Pendiente';
                } else if (filtroEstadoActual === 'Recibidos') {
                    mostrar = registroData.estado === 'Recibido';
                } else if (filtroEstadoActual === 'Ingresados') {
                    mostrar = registroData.estado === 'Ingresado';
                } else if (filtroEstadoActual === 'Rechazados') {
                    mostrar = registroData.estado === 'Rechazado';
                } else if (filtroEstadoActual === 'No llegaron') {
                    mostrar = registroData.estado === 'No llego';
                }
            }
            let fechaFiltrar = '';
            if (registroData.estado === 'Pendiente') {
                fechaFiltrar = registroData.fecha;
            } else if (registroData.estado === 'Recibido') {
                fechaFiltrar = registroData.fechaEntrega;
            } else if (registroData.estado === 'Ingresado') {
                fechaFiltrar = registroData.fechaIngreso;
            }

            if (mostrar && fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = fechaFiltrar.split('/');
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
                    registroData.idProducto,
                    registroData.fecha,
                    registroData.proovedor,
                    registroData.estado
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

    inputBusqueda.addEventListener('input', () => {
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
    window.info = function (registroId) {
        const registro = pedidosGlobal.find(r => r.id === registroId);
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
                    ${registro.estado === 'Pendiente' && usuarioInfo.rol === 'Administración' ? `
                        <button class="btn-entregar btn green" data-id="${registro.id}"><i class='bx bx-check-circle'></i></button>
                    ` : ''}
                    ${registro.estado === 'Recibido' ? `
                        <button class="btn-ingresar btn blue" data-id="${registro.id}"><i class='bx bx-log-in'></i></button>
                        <button class="btn-rechazar btn orange" data-id="${registro.id}"><i class='bx bx-block'></i></button>
                    ` : ''}
                    ${registro.estado === 'No llego' && usuarioInfo.rol === 'Administración' ? `
                        <button class="btn-llego btn orange" data-id="${registro.id}"><i class='bx bx-check-circle'></i></button>
                    ` : ''}
                    ${tienePermiso('edicion') && registro.estado !== 'Recibido' ? `<button class="btn-editar btn blue" data-id="${registro.id}"><i class='bx bx-edit'></i></button>` : ''}
                    ${tienePermiso('eliminacion') ? `<button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i></button>` : ''}
                </div>
            </div>
        </div>
        
        <div class="contenido">
            <p class="subtitulo">Información del pedido</p>
            <div class="campo-vertical">
                <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                <div class="detalle-campo"><span><i class='bx bx-package'></i> Cantidad pedida: </span>${registro.cantidadPedida}</div>
                <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                <div class="detalle-campo"><span><i class='bx bx-check-circle'></i> Estado: </span>${registro.estado}</div>
            </div>

            <p class="subtitulo">Detalles del producto</p>
            <div class="campo-vertical">
                <div class="detalle-campo"><span><i class='bx bx-cube'></i> Producto: </span>${registro.producto}</div>
                <div class="detalle-campo"><span><i class='bx bx-barcode'></i> ID Producto: </span>${registro.idProducto}</div>
                <div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones: </span>${registro.observacionesPedido || 'Sin observaciones'}</div>
            </div>

            ${registro.estado !== 'Pendiente' ? `
            <p class="subtitulo">Información de recepción</p>
            <div class="campo-vertical">
                <div class="detalle-campo"><span><i class='bx bx-package'></i> Fecha de compra: </span>${registro.fechaEntrega || 'No registrado'}</div>
                ${usuarioInfo.rol === 'Administración' ? `
                <div class="detalle-campo"><span><i class='bx bx-package'></i> Cantidad entregada (KG): </span>${registro.cantidadEntregadaKg || 'No registrado'}</div>` : ''}
                <div class="detalle-campo"><span><i class='bx bx-package'></i> Cantidad entregada (UND): </span>${registro.cantidadEntregadaUnd || 'No registrado'}</div>
                <div class="detalle-campo"><span><i class='bx bx-user'></i> Proveedor: </span>${registro.proovedor || 'No registrado'}</div>
                ${usuarioInfo.rol === 'Administración' ? `
                <div class="detalle-campo"><span><i class='bx bx-money'></i> Precio: </span>${'Bs. ' + (parseFloat(registro.precio) || 0).toFixed(2) || 'No registrado'}</div>` : ''}
                <div class="detalle-campo"><span><i class='bx bx-money'></i> Estado: </span>${registro.estadoCompra || 'No registrado'}</div>
                <div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones compras: </span>${registro.observacionesCompras || 'Sin observaciones'}</div>
            </div>
            ` : ''}

            ${registro.estado === 'Ingresado' ? `
            <p class="subtitulo">Información de ingreso</p>
            <div class="campo-vertical">
                <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha ingreso: </span>${registro.fechaIngreso || 'No registrado'}</div>
                <div class="detalle-campo"><span><i class='bx bx-package'></i> Cantidad ingresada(KG): </span>${registro.cantidadIngresada || 'No registrado'}</div>
                <div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones ingreso: </span>${registro.observacionesIngresado || 'Sin observaciones'}</div>
            </div>
            ` : ''}
            
        </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        const btnEntregar = contenido.querySelector('.btn-entregar');
        const btnIngresar = contenido.querySelector('.btn-ingresar');
        const btnRechazar = contenido.querySelector('.btn-rechazar');
        const btnLlego = contenido.querySelector('.btn-llego');


        if (tienePermiso('edicion') && registro.estado !== 'Recibido') {
            const btnEditar = contenido.querySelector('.btn-editar');
            btnEditar.addEventListener('click', () => editar(registro));
        }
        if (tienePermiso('eliminacion')) {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }
        if (btnEntregar) {
            btnEntregar.addEventListener('click', () => entregar(registro));
        }
        if (btnIngresar) {
            btnIngresar.addEventListener('click', () => ingresar(registro));
        }
        if (btnRechazar) {
            btnRechazar.addEventListener('click', () => rechazar(registro));
        }
        if (btnLlego) {
            btnLlego.addEventListener('click', () => llego(registro));
        }

        function eliminar(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Eliminar pedido</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-eliminar-registro btn red"><i class="bx bx-trash"></i> Eliminar</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información básica</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Cantidad pedida: </span>${registro.cantidadPedida}</div>
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                    <div class="detalle-campo"><span><i class='bx bx-check-circle'></i> Estado: </span>${registro.estado}</div>
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
                        <p>Vas a eliminar un registro del sistema. Esta acción no se puede deshacer y podría afectar a otros registros relacionados. Asegúrate de que deseas continuar.</p>
                    </div>
                </div>
            </div>
                `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            const btnEliminar = contenido.querySelector('.btn-eliminar-registro');
            btnEliminar.addEventListener('click', confirmarEliminacion);

            async function confirmarEliminacion() {
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la eliminación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/eliminar-pedido/${registro.id}`, {
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
                        await obtenerPedidos();
                        cerrarAnuncioManual('anuncioSecond');
                        ocultarScreen();
                        mostrarNotificacion('Se elimino el pedido', { tipo: 'exito', duracion: 2000 })
                    } else {
                        mostrarNotificacion('Error al elimininar el pedido', { tipo: 'error' })
                        throw new Error(data.error || 'Error al eliminar el pedido');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al elimininar el pedido', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }
        async function editar(registro) {
            await obtenerAlmacenAcopio();
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
            
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Editar pedido</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-guardar-edicion btn blue"><i class="bx bx-save"></i> Guardar</button>
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Información básica</p>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <input class="producto-pedido" type="text" value="${registro.producto}">
                    </div>
                </div>
                <div class="sugerencias" id="productos-list"></div>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Cantidad Pedida</p>
                        <input class="cantidad-pedida" type="text" value="${registro.cantidadPedida}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Observaciones Pedido</p>
                        <input class="obs-pedido" type="text" value="${registro.observacionesPedido || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-check-circle'></i>
                    <div class="input">
                        <p class="detalle">Estado</p>
                        <select class="estado" required>
                            <option value="${registro.estado}" selected>${registro.estado}</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="No llego">No llego</option>
                            <option value="Recibido">Recibido</option>
                            <option value="Rechazado">Rechazado</option>
                            <option value="Ingresado">Ingresado</option>
                        </select>
                    </div>
                </div>
                <p class="subtitulo">Información de compra</p>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Cantidad Entregada (Kg)</p>
                        <input class="cant-entr-kg" type="text" value="${registro.cantidadEntregadaKg || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-store'></i>
                    <div class="input">
                        <p class="detalle">Proveedor</p>
                        <input class="proovedor" type="text" value="${registro.proovedor || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-money'></i>
                    <div class="input">
                        <p class="detalle">Precio</p>
                        <input class="precio" type="text" value="${registro.precio || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Observaciones Compras</p>
                        <input class="obs-compras" type="text" value="${registro.observacionesCompras || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Cantidad Entregada (Unidades)</p>
                        <input class="cant-entrg-und" type="text" value="${registro.cantidadEntregadaUnd || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-car'></i>
                    <div class="input">
                        <p class="detalle">Transporte/Otros</p>
                        <input class="trasp-otros" type="text" value="${registro.transporteOtros || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-check-circle'></i>
                    <div class="input">
                        <p class="detalle">Estado Compra</p>
                        <input class="estado-compra" type="text" value="${registro.estadoCompra}">
                    </div>
                </div>
                <p class="normal">Información de ingreso</p>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Cantidad Ingresada</p>
                        <input class="cant-ingre" type="text" value="${registro.cantidadIngresada || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Observaciones Ingreso</p>
                        <input class="obs-ingre" type="text" value="${registro.observacionesIngresado}">
                    </div>
                </div>
                <p class="normal">Ingresa el motivo de la edición</p>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Motivo de edición</p>
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

            const productoInput = document.querySelector('.entrada .producto-pedido');
            const sugerenciasList = document.querySelector('#productos-list');

            function normalizarTexto(texto) {
                return texto.toString()
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[-_\s]+/g, '');
            }

            productoInput.addEventListener('input', (e) => {
                const valor = normalizarTexto(e.target.value);

                sugerenciasList.innerHTML = '';

                if (valor) {
                    const sugerencias = productos.filter(p =>
                        normalizarTexto(p.producto).includes(valor)
                    ).slice(0, 5);

                    if (sugerencias.length) {
                        sugerenciasList.style.display = 'flex';
                        sugerencias.forEach(p => {
                            const div = document.createElement('div');
                            div.classList.add('item');
                            div.textContent = p.producto;
                            div.onclick = () => {
                                productoInput.value = p.producto;
                                sugerenciasList.style.display = 'none';
                                window.idPro = p.id;
                            };
                            sugerenciasList.appendChild(div);
                        });
                    }
                } else {
                    sugerenciasList.style.display = 'none';
                }
            });

            const btnGuardar = contenido.querySelector('.btn-guardar-edicion');
            btnGuardar.addEventListener('click', confirmarEdicion);

            async function confirmarEdicion() {
                try {
                    const datosActualizados = {
                        idProducto: window.idPro,
                        productoPedido: document.querySelector('.producto-pedido').value,
                        cantidadPedida: document.querySelector('.cantidad-pedida').value,
                        observacionesPedido: document.querySelector('.obs-pedido').value,
                        estado: document.querySelector('.estado').value,
                        cantidadEntregadaKg: document.querySelector('.cant-entr-kg').value,
                        proovedor: document.querySelector('.proovedor').value,
                        precio: document.querySelector('.precio').value,
                        observacionesCompras: document.querySelector('.obs-compras').value,
                        cantidadEntregadaUnd: document.querySelector('.cant-entrg-und').value,
                        transporteOtros: document.querySelector('.trasp-otros').value,
                        estadoCompra: document.querySelector('.estado-compra').value,
                        cantidadIngresada: document.querySelector('.cant-ingre').value,
                        observacionesIngresado: document.querySelector('.obs-ingre').value,
                        motivo: document.querySelector('.motivo').value
                    };

                    if (!datosActualizados.motivo) {
                        mostrarNotificacion('Ingresa el motivo de la edición')
                        return;
                    }

                    mostrarCarga();

                    const response = await fetch(`/editar-pedido/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(datosActualizados)
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerPedidos();
                        info(registroId)
                        updateHTMLWithData();
                        mostrarNotificacion('Se actualizo el pedido', { tipo: 'exito', duracion: 2000 })
                    } else {
                        mostrarNotificacion('Error al actualizar el pedido', { tipo: 'error' })
                        throw new Error(data.error || 'Error al actualizar el pedido');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al actualizar el pedido', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }
        function entregar(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Entregar pedido</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-confirmar-entrega btn green"><i class='bx bx-check-circle'></i> Finalizar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información del pedido</p>
                    <div class="campo-horizontal">
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                            <div class="detalle-campo"><span><i class='bx bx-box'></i> Producto: </span>${registro.producto}</div>
                            <div class="detalle-campo"><span><i class='bx bx-package'></i> Cantidad pedida: </span>${registro.cantidadPedida}</div>
                            <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                        </div>
                    </div>

                    <p class="subtitulo">Detalles de entrega</p>
                    <div class="entrada">
                        <i class='bx bx-package'></i>
                        <div class="input">
                            <p class="detalle">Cantidad entregada (KG)</p>
                            <input class="cantidad-kg" type="number" step="0.01" autocomplete="off" required>
                        </div>
                    </div>

                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Cantidad</p>
                                <input class="cantidad-und" type="number" autocomplete="off" required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Medida</p>
                                <select class="unidad-medida">
                                    <option value="Bolsas">Bolsas</option>
                                    <option value="Cajas">Cajas</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="entrada">
                        <i class='bx bx-user'></i>
                        <div class="input">
                            <p class="detalle">Proveedor</p>
                            <select class="proovedor" required>
                                <option value=""></option>
                                ${proovedoresAcopioGlobal.map(p => `
                                    <option value="${p.nombre}">${p.nombre}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-money'></i>
                            <div class="input">
                                <p class="detalle">Precio</p>
                                <input class="precio" type="number" step="0.01" autocomplete="off" required>
                            </div>
                        </div>

                        <div class="entrada">
                            <i class='bx bx-car'></i>
                            <div class="input">
                                <p class="detalle">Trans./Otros</p>
                                <input class="transporte" type="text" autocomplete="off">
                            </div>
                        </div>
                    </div>

                    <div class="entrada">
                        <i class='bx bx-check-circle'></i>
                        <div class="input">
                            <p class="detalle">Estado de entrega</p>
                            <select class="estado-compra" required>
                                <option value="Llego">Llegó</option>
                                <option value="No llego">No llegó</option>
                            </select>
                        </div>
                    </div>

                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="observaciones" type="text" autocomplete="off">
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por realizar una entrega. Asegúrate de llenar los campos con información correcta, ya que esta acción podria afectar información relacionada.</p>
                        </div>
                    </div>

                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();


            const btnConfirmar = contenido.querySelector('.btn-confirmar-entrega');
            btnConfirmar.addEventListener('click', confirmarEntrega);

            async function confirmarEntrega() {
                try {
                    const cantidadKg = document.querySelector('.cantidad-kg').value;
                    const cantidadUnd = document.querySelector('.cantidad-und').value;
                    const unidadMedida = document.querySelector('.unidad-medida').value;
                    const proovedor = document.querySelector('.proovedor').value;
                    const precio = parseFloat(document.querySelector('.precio').value);
                    const transporteOtros = parseFloat(document.querySelector('.transporte').value) || 0;
                    const estadoCompra = document.querySelector('.estado-compra').value;
                    const observaciones = document.querySelector('.observaciones').value;

                    // Validaciones básicas
                    if (!cantidadKg || !cantidadUnd || !proovedor || !precio) {
                        mostrarNotificacion('Complete todos los campos requeridos')
                        return;
                    }

                    mostrarCarga();

                    // 1. Registrar la entrega del pedido
                    const entregaResponse = await fetch(`/entregar-pedido/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            cantidadKg: parseFloat(cantidadKg),
                            cantidadUnidad: parseInt(cantidadUnd),
                            unidadMedida,
                            proovedor,
                            precio,
                            transporteOtros,
                            estadoCompra,
                            observaciones
                        })
                    });

                    const entregaData = await entregaResponse.json();

                    if (entregaData.success) {
                        await obtenerPedidos();
                        info(registroId)
                        updateHTMLWithData();
                        mostrarNotificacion('Se realizo la entrega del pedido', { tipo: 'exito', duracion: 2000 })
                        ocultarCarga();


                        // Actualizar mensaje de compras y notificar éxito
                        if (mensajeCompras === 'Se compro:\n• Sin compras registradas') {
                            mensajeCompras = 'Se compro:\n';
                        }
                        mensajeCompras = mensajeCompras.replace(/\n\nSe compro en la App de TotalProd.$/, '');
                        mensajeCompras = mensajeCompras.replace(/\n$/, '');
                        mensajeCompras += `\n• ${registro.producto} - ${cantidadUnd} ${unidadMedida} (${estadoCompra})`;
                        mensajeCompras += '\n\nSe compro en la App de TotalProd.';
                        localStorage.setItem('damabrava_mensaje_compras', mensajeCompras);

                        // 2. En segundo plano: crear registro de pago genérico y parcial
                        (async () => {
                            try {
                                const totalPago = precio + transporteOtros;
                                const proveedorInfo = proovedoresAcopioGlobal.find(p => p.nombre === proovedor);
                                const pagoGenerico = {
                                    nombre_pago: `Materia prima (${registro.producto})`,
                                    id_beneficiario: proveedorInfo?.id || 'No registrado',
                                    beneficiario: proovedor,
                                    pagado_por: usuarioInfo.nombre + ' ' + usuarioInfo.apellido,
                                    justificativos_id: registro.id,
                                    justificativos: 'Pago de materia prima: ' + registro.producto + ' (Bs./' + (parseFloat(precio) || 0).toFixed(2) + ')Transporte: (Bs./' + (parseFloat(transporteOtros) || 0).toFixed(2) + ')' + 'Cantidad: ' + cantidadUnd + ' ' + unidadMedida,
                                    subtotal: totalPago,
                                    descuento: 0,
                                    aumento: 0,
                                    total: totalPago,
                                    observaciones: observaciones || 'Sin observaciones',
                                    estado: 'Pagado',
                                    tipo: 'Acopio'
                                };
                                const pagoResponse = await fetch('/registrar-pago', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(pagoGenerico)
                                });
                                const pagoData = await pagoResponse.json();
                                if (pagoData.success) {
                                    // 3. Registrar pago parcial
                                    const pagoParcial = {
                                        pago_id: pagoData.id,
                                        pagado_por: usuarioInfo.nombre + ' ' + usuarioInfo.apellido,
                                        beneficiario: proovedor,
                                        cantidad_pagada: totalPago,
                                        observaciones: observaciones || 'Sin observaciones',
                                    };
                                    await fetch('/registrar-pago-parcial', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(pagoParcial)
                                    });
                                    mostrarNotificacion({
                                        message: 'Pago registrado correctamente',
                                        type: 'success',
                                        duration: 3000
                                    });
                                }
                            } catch (err) {
                                console.error('Error en el registro de pagos en segundo plano:', err);
                                mostrarNotificacion({
                                    message: 'Error al registrar el pago',
                                    type: 'error',
                                    duration: 3500
                                });
                            }
                        })();
                        // Fin segundo plano
                    } else {
                        mostrarNotificacion('Error al entregar el pedido', { tipo: 'error' })
                        throw new Error(entregaData.error || 'Error al entregar el pedido');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al entregar el pedido', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }
        async function ingresar(registro) {
            localStorage.setItem('tipoEventoLocal', 'ingresos');
            mostrarAlmacenAcopio(registro.idProducto, registro.id);
        }
        async function rechazar(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Rechazar Pedido</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn red" onclick="confirmarRechazo('${registro.id}')"><i class='bx bx-x-circle'></i> Rechazar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información del pedido</p>
                    <div class="campo-horizontal">
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                            <div class="detalle-campo"><span><i class='bx bx-package'></i> Cantidad pedida: </span>${registro.cantidadPedida}</div>
                            <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                            <div class="detalle-campo"><span><i class='bx bx-check-circle'></i> Estado: </span>${registro.estado}</div>
                        </div>
                    </div>

                    <p class="subtitulo">Motivo del rechazo</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="input-motivo" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por rechazar un pedido. Asegúrate de ingresar el motivo del rechazo, ya que podrían afectar información relacionada.</p>
                        </div>
                    </div>
                </div>

            `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            window.confirmarRechazo = async function (idPedido) {
                const motivo = document.querySelector('.input-motivo').value;

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo del rechazo')
                    return;
                }

                try {
                    mostrarCarga();

                    const response = await fetch(`/rechazar-pedido/${idPedido}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();
                    if (data.success) {
                        await obtenerPedidos();
                        info(registroId)
                        updateHTMLWithData();
                        mostrarNotificacion('Se rechazo el pedido', { tipo: 'exito', duracion: 2000 })
                    }
                } catch (error) {
                    mostrarNotificacion('Error al rechazar el pedido', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            };
        }
        async function llego(registro) {

            try {
                mostrarCarga();

                const response = await fetch(`/llego-pedido/${registro.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await response.json();
                if (data.success) {
                    await obtenerPedidos();
                    info(registroId)
                    updateHTMLWithData();
                    mostrarNotificacion('Se cambio el estado a llego', { tipo: 'exito', duracion: 2000 })
                }
            } catch (error) {
                mostrarNotificacion('Error al cambiar el estado a llego', { tipo: 'error' })
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        };

    }


    window.mostrarMensajeCompras = function () {
        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Compras</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn blue" onclick="limpiarFormatoCompras()">
                            <i class="bx bx-trash"></i>
                        </button>
                        <button class="btn green" onclick="compartirFormatoCompras()">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="formato-pedido">
                <div contenteditable="true" style="min-height: fit-content; white-space: pre-wrap; font-family: Arial, sans-serif; text-align: left; padding: 15px;">${mensajeCompras}</div>
            </div>
            `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen();
    }
    window.limpiarFormatoCompras = function () {
        mensajeCompras = 'Se compro:\n• Sin compras registradas';
        localStorage.setItem('damabrava_mensaje_compras', mensajeCompras);
        const formatoDiv = document.querySelector('.formato-pedido div[contenteditable]');
        if (formatoDiv) {
            formatoDiv.innerHTML = mensajeCompras;
        }
    };
    window.compartirFormatoCompras = async function () {
        const formatoDiv = document.querySelector('.formato-pedido div[contenteditable]');
        if (!formatoDiv) return;

        const texto = encodeURIComponent(formatoDiv.innerText);
        window.open(`https://wa.me/?text=${texto}`, '_blank');
    };
    btnNuevoPedido.addEventListener('click', () => {
        localStorage.setItem('tipoEventoLocal', 'orden');
        window.mostrarVistaCorrespondiente('almacen-acopio-cont');
        mostrarAlmacenAcopio();
    });

    aplicarFiltros();
}