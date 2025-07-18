import { productos } from "./almacen-general.js";
let registrosAlmacen = [];
let proovedores = [];
let clientes = [];


const DB_NAME = 'damabrava_db';
const REGISTROS_ALM_DB = 'registros_almacen';
const PROVEEDOR_DB = 'proveedores';
const CLIENTE_DB = 'clientes';


async function obtenerProovedores() {
    try {
        const proovedoresCache = await obtenerLocal(PROVEEDOR_DB, DB_NAME);

        if (proovedoresCache.length > 0) {
            proovedores = proovedoresCache.sort((a, b) => {
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
            proovedores = data.proovedores.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Descending order
            });

            if (JSON.stringify(proovedoresCache) !== JSON.stringify(proovedores)) {
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
                        for (const item of proovedores) {
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
async function obtenerClientes() {
    try {

        const clientesCache = await obtenerLocal(CLIENTE_DB, DB_NAME);

        if (clientesCache.length > 0) {
            clientes = clientesCache.sort((a, b) => {
                const nombreA = a.nombre.toLowerCase();
                const nombreB = b.nombre.toLowerCase();
                return nombreA.localeCompare(nombreB);
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }


        const response = await fetch('/obtener-clientes');
        const data = await response.json();

        if (data.success) {
            clientes = data.clientes.sort((a, b) => {
                const nombreA = a.nombre.toLowerCase();
                const nombreB = b.nombre.toLowerCase();
                return nombreA.localeCompare(nombreB);
            });

            if (JSON.stringify(clientesCache) !== JSON.stringify(clientes)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(CLIENTE_DB, DB_NAME);
                        const tx = db.transaction(CLIENTE_DB, 'readwrite');
                        const store = tx.objectStore(CLIENTE_DB);

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
        console.error('Error al obtener clientes:', error);
        return false;
    }
}
async function obtenerRegistrosAlmacen() {
    try {
        const registrosCacheAlmacen = await obtenerLocal(REGISTROS_ALM_DB, DB_NAME);

        // Si hay registros en caché, actualizar la UI inmediatamente
        if (registrosCacheAlmacen.length > 0) {
            registrosAlmacen = registrosCacheAlmacen.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
        }

        const response = await fetch('/obtener-movimientos-almacen');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar de más reciente a más antiguo
            registrosAlmacen = data.movimientos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Orden descendente por número de ID
            });

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(registrosCacheAlmacen) !== JSON.stringify(registrosAlmacen)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(REGISTROS_ALM_DB, DB_NAME);
                        const tx = db.transaction(REGISTROS_ALM_DB, 'readwrite');
                        const store = tx.objectStore(REGISTROS_ALM_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const registro of registrosAlmacen) {
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
            }



            return true;
        } else {
            throw new Error(data.error || 'Error al obtener los productos');
        }
    } catch (error) {
        console.error('Error al obtener registros:', error);
        mostrarNotificacion({
            message: 'Error al obtener registros',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}


function renderInitialHTML() {

    const view = document.querySelector('.registros-almacen-cont');
    const initialHTML = `  
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Registros almacen</p>
                </div>
                <div class="botones-container">
                    
                </div>
            </div>
            <div class="buscador-view">
                <button class="lupa"><i class='bx bx-search'></i></button>
                <input type="text" class="search" placeholder="Buscar...">
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
                <button class="limpiar-search" style="right:45px"><i class='bx bx-x'></i></button>
            </div>
            <div class="filtros-view tipo">
                <button class="btn-filtro activo">Todos</button>
                <button class="btn-filtro">Ingresos</button>
                <button class="btn-filtro">Salidas</button>
                <button class="btn-filtro">Anulados</button>
                <select class="proovedor-cliente select" style="width:100%">
                    <option value="Todos" class="defecto">Todos</option>
                </select>
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
export async function mostrarMovimientosAlmacen() {
    renderInitialHTML();
    const [clientes, proveedores, registros] = await Promise.all([
        obtenerClientes(),
        obtenerProovedores(),
        await obtenerRegistrosAlmacen(),
    ]);
}
function updateHTMLWithData() {
    const productosContainer = document.querySelector('.registros-almacen-cont .contenido-view');
    // Mostrar solo los primeros 200 registros
    const registrosLimitados = registrosAlmacen.slice(0, 200);
    const productosHTML = registrosLimitados.map(registro => `
        <div class="item-view" data-id="${registro.id}">
            <div class="header-view">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${registro.id}</span><span class="flotante-view ${registro.tipo === 'Ingreso' ? 'green' : registro.tipo === 'Salida' ? 'red' : 'orange'}">${registro.tipo}</span></span>
                    <span class="detalle"><span>${registro.nombre_movimiento}</span></span>
                    <span class="pie">${registro.fecha_hora} <span class="neutro">Bs. ${registro.total}</span></span>
                </div>
            </div>
        </div>
    `).join('');
    // Botones para cargar más si hay más de 250
    const showMoreButton = registrosAlmacen.length > 200 ? `
        <div class="show-more-container">
            <button class="btn show-more">
                <i class='bx bx-show'></i> Mostrar +50
            </button>
            <button class="btn show-all">
                <i class='bx bx-list-ul'></i> Mostrar todos
            </button>
        </div>
    ` : '';
    productosContainer.innerHTML = productosHTML + showMoreButton;
    eventosRegistrosAlmacen();
}



function eventosRegistrosAlmacen() {
    const botonesTipo = document.querySelectorAll('.filtros-view.tipo .btn-filtro');

    const items = document.querySelectorAll('.item-view');
    const btnLimpiar = document.querySelector('.limpiar-search');
    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');


    // Enlazar eventos a los nuevos botones
    const showMoreBtn = document.querySelector('.show-more');
    const showAllBtn = document.querySelector('.show-all');
    if (showMoreBtn) showMoreBtn.addEventListener('click', cargarMasRegistrosAlmacen);
    if (showAllBtn) showAllBtn.addEventListener('click', cargarTodosLosRegistrosAlmacen);

    function cargarMasRegistrosAlmacen() {
        const productosContainer = document.querySelector('.registros-almacen-cont .contenido-view');
        const currentItems = document.querySelectorAll('.item-view').length;
        const nextBatch = registrosAlmacen.slice(currentItems, currentItems + 50);
        if (nextBatch.length > 0) {
            const newItemsHTML = nextBatch.map(registro => `
                <div class="item-view" data-id="${registro.id}">
                    <div class="header-view">
                        <i class='bx bx-file'></i>
                        <div class="info-header">
                            <span class="id-flotante"><span class="id">${registro.id}</span><span class="flotante-view ${registro.tipo === 'Ingreso' ? 'green' : registro.tipo === 'Salida' ? 'red' : 'orange'}">${registro.tipo}</span></span>
                            <span class="detalle"><span>${registro.nombre_movimiento}</span></span>
                            <span class="pie">${registro.fecha_hora} <span class="neutro">Bs. ${registro.total}</span></span>
                        </div>
                    </div>
                </div>
            `).join('');
            // Quitar el show more container
            const showMoreContainer = document.querySelector('.show-more-container');
            if (showMoreContainer) showMoreContainer.remove();
            // Agregar nuevos items
            productosContainer.insertAdjacentHTML('beforeend', newItemsHTML);
            // Agregar show more de nuevo si quedan más
            if (currentItems + nextBatch.length < registrosAlmacen.length) {
                productosContainer.insertAdjacentHTML('beforeend', `
                    <div class="show-more-container">
                        <button class="btn show-more">
                            <i class='bx bx-show'></i> Mostrar +50
                        </button>
                        <button class="btn show-all">
                            <i class='bx bx-list-ul'></i> Mostrar todos
                        </button>
                    </div>
                `);
                // Reenlazar eventos
                const showMoreBtn = document.querySelector('.show-more');
                const showAllBtn = document.querySelector('.show-all');
                if (showMoreBtn) showMoreBtn.addEventListener('click', cargarMasRegistrosAlmacen);
                if (showAllBtn) showAllBtn.addEventListener('click', cargarTodosLosRegistrosAlmacen);
            }
            // Reenlazar eventos a los nuevos items
            eventosRegistrosAlmacen();
        }
    }
    function cargarTodosLosRegistrosAlmacen() {
        const productosContainer = document.querySelector('.registros-almacen-cont .contenido-view');
        const currentItems = document.querySelectorAll('.item-view').length;
        const remainingRecords = registrosAlmacen.slice(currentItems);
        if (remainingRecords.length > 0) {
            const newItemsHTML = remainingRecords.map(registro => `
                <div class="item-view" data-id="${registro.id}">
                    <div class="header-view">
                        <i class='bx bx-file'></i>
                        <div class="info-header">
                            <span class="id-flotante"><span class="id">${registro.id}</span><span class="flotante-view ${registro.tipo === 'Ingreso' ? 'green' : registro.tipo === 'Salida' ? 'red' : 'orange'}">${registro.tipo}</span></span>
                            <span class="detalle"><span>${registro.nombre_movimiento}</span></span>
                            <span class="pie">${registro.fecha_hora} <span class="neutro">Bs. ${registro.total}</span></span>
                        </div>
                    </div>
                </div>
            `).join('');
            // Quitar el show more container
            const showMoreContainer = document.querySelector('.show-more-container');
            if (showMoreContainer) showMoreContainer.remove();
            // Agregar todos los items restantes
            productosContainer.insertAdjacentHTML('beforeend', newItemsHTML);
            eventosRegistrosAlmacen();
        }
    }

    let filtroNombreActual = 'Todos';
    let filtroFechaInstance = null;

    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
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
    botonesTipo.forEach(boton => {
        if (boton.classList.contains('activo')) {
            filtroNombreActual = boton.textContent.trim();
        }
        boton.addEventListener('click', async () => {
            botonesTipo.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');

            const tipoFiltro = boton.textContent.trim().toLowerCase();

            if (tipoFiltro === 'ingresos') {
                filtroNombreActual = 'ingreso';
            }
            else if (tipoFiltro === 'salidas') {
                filtroNombreActual = 'salida';
            }
            else if (tipoFiltro === 'todos') {
                filtroNombreActual = 'todos';
            } else if (tipoFiltro === 'anulados') {
                filtroNombreActual = 'anulado';
            }

            aplicarFiltros();
            actualizarSelectProovedorCliente(filtroNombreActual);
            await scrollToCenter(boton, boton.parentElement);
        });
    });
    btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.focus();
        toggleLimpiarBtn();
        aplicarFiltros();
    });
    function aplicarFiltros() {
        const filtroTipo = filtroNombreActual;
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const proveedorClienteSeleccionado = normalizarTexto(document.querySelector('.proovedor-cliente').value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = registrosAlmacen.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Filtro por tipo (Ingresos/Salidas)
            if (filtroTipo !== 'todos') {
                const tipoRegistro = normalizarTexto(registroData.tipo);
                if (filtroTipo === 'ingreso') {
                    mostrar = (tipoRegistro === 'ingreso');
                } else if (filtroTipo === 'salida') {
                    mostrar = (tipoRegistro === 'salida');
                }
                else if (filtroTipo === 'anulado') {
                    mostrar = (tipoRegistro === 'anulado');
                }
            }

            // Filtro por proveedor/cliente
            if (mostrar && proveedorClienteSeleccionado !== 'todos') {
                const nombreCompleto = normalizarTexto(registroData.cliente_proovedor.split('(')[0]);
                mostrar = nombreCompleto.includes(proveedorClienteSeleccionado);
            }

            // Filtro de fechas
            if (mostrar && fechasSeleccionadas.length === 2) {
                const [fechaPart] = registroData.fecha_hora.split(','); // Dividir por coma primero
                const [dia, mes, anio] = fechaPart.trim().split('/'); // Quitar espacios y dividir
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];
                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }

            // Filtro de búsqueda
            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.nombre_movimiento,
                    registroData.tipo,
                    registroData.fecha_hora,
                    registroData.cliente_proovedor,
                    registroData.estado
                ].filter(Boolean).join(' ').toLowerCase();
                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        const registrosVisibles = registrosFiltrados.filter(r => r.mostrar).length;

        // Ocultar todos con una transición suave
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
    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    function toggleLimpiarBtn() {
        if (inputBusqueda.value.trim() !== '') {
            btnLimpiar.style.display = 'block';
        } else {
            btnLimpiar.style.display = 'none';
        }
    }
    inputBusqueda.addEventListener('input', (e) => {
        toggleLimpiarBtn();
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });

    document.querySelector('.proovedor-cliente').addEventListener('change', aplicarFiltros);
    function actualizarSelectProovedorCliente(tipoFiltro) {
        const select = document.querySelector('.proovedor-cliente');
        select.innerHTML = '<option value="Todos" class="defecto">Todos</option>';

        if (tipoFiltro === 'ingreso') {
            proovedores.forEach(proovedor => {
                select.innerHTML += `
                <option value="${proovedor.nombre}">${proovedor.nombre}</option>
            `;
            });
            const defectoOption = select.querySelector('.defecto');
            if (defectoOption) {
                defectoOption.textContent = 'Proveedores';
            }
            filtroNombreActual = 'ingreso';
        }
        else if (tipoFiltro === 'salida') {
            clientes.forEach(cliente => {
                select.innerHTML += `
                <option value="${cliente.nombre}">${cliente.nombre}</option>
            `;
            });
            const defectoOption = select.querySelector('.defecto');
            if (defectoOption) {
                defectoOption.textContent = 'Clientes';
            }
            filtroNombreActual = 'salida';
        }
        else if (tipoFiltro === 'Todos') {
            filtroNombreActual = 'Todos';
        }
    }

    window.info = function (registroId) {
        const registro = registrosAlmacen.find(r => r.id === registroId);
        if (!registro) return; // Changed from registrosProduccion

        const contenido = document.querySelector('.screen');
        const registrationHTML = `

            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Información</p>
                    </div>
                    <div class="botones-container">
                        ${tienePermiso('anulacion') && registro.tipo != 'Anulado' ? `<button class="btn-anular btn orange" data-id="${registro.id}"><i class='bx bx-x-circle'></i></button>` : ''}
                        ${tienePermiso('eliminacion') && registro.tipo === 'Anulado' ? `<button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i></button>` : ''}
                        <button class="btn-copia btn blue" data-id="${registro.id}"><i class='bx bx-copy'></i></button>
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Información básica</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span>${registro.nombre_movimiento}</div>
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha_hora.split(',')[0]}</div>
                    <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora: </span>${registro.fecha_hora.split(',')[1]}</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Tipo: </span>${registro.tipo}</div>
                </div>

                <p class="subtitulo">Detalles del movimiento</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span>${registro.nombre_movimiento}</div>
                    <div class="detalle-campo"><span><i class='bx bx-user'></i> Cliente/Proveedor: </span>${registro.cliente_proovedor.split('(')[0].trim()}</div>
                    <div class="detalle-campo"><span><i class='bx bx-user-circle'></i> Responsable: </span>${registro.operario}</div>
                </div>

                <p class="subtitulo">Productos y cantidades</p>
                <div class="campo-vertical">
                    ${registro.productos.split(';').map((producto, index) => {
            const cantidad = registro.cantidades.split(';')[index] || 'N/A';
            return `
                            <div class="detalle-campo"><span><i class='bx bx-box'></i> ${producto.trim()}</span>${cantidad.trim()} Und.</div>
                        `;
        }).join('')}
                </div>
                <p class="subtitulo">Detalles financieros</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-dollar-circle'></i> Subtotal: </span>Bs. ${registro.subtotal}</div>
                    <div class="detalle-campo"><span><i class='bx bx-tag'></i> Descuento: </span>Bs. ${registro.descuento}</div>
                    <div class="detalle-campo"><span><i class='bx bx-trending-up'></i> Aumento: </span>Bs. ${registro.aumento}</div>
                    <div class="detalle-campo"><span><i class='bx bx-money'></i> Total: </span>Bs. ${registro.total}</div>
                </div>

                <p class="subtitulo">Observaciones</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones: </span>${registro.observaciones || 'Ninguna'}</div>
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen();



        if (tienePermiso('anulacion') && registro.tipo != 'Anulado') {
            const btnAnular = contenido.querySelector('.btn-anular');
            btnAnular.addEventListener('click', () => anular(registro));
        }
        if (tienePermiso('eliminacion') && registro.tipo === 'Anulado') {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }

        const btnCopia = contenido.querySelector('.btn-copia');

        btnCopia.addEventListener('click', () => copia(registro));


        function eliminar(registro) { // Changed 
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Eliminar registro</p>
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
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span>${registro.nombre_movimiento}</div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha_hora.split(',')[0]}</div>
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora: </span>${registro.fecha_hora.split(',')[1]}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Tipo: </span>${registro.tipo}</div>
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

            // Agregar evento al botón guardar
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
                    const response = await fetch(`/eliminar-registro-almacen/${registroId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerRegistrosAlmacen();
                        ocultarScreen();
                        updateHTMLWithData();
                        mostrarNotificacion('Se elimino el registro', { tipo: 'exito', duracion: 2000 })
                    } else {
                        throw new Error(data.error || 'Error al eliminar el registro');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al eliminar el registro', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }
        function anular(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Anular registro</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-anular-registro btn red"><i class='bx bx-x-circle'></i> Anular</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información básica</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span>${registro.nombre_movimiento}</div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha_hora.split(',')[0]}</div>
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora: </span>${registro.fecha_hora.split(',')[1]}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Tipo: </span>${registro.tipo}</div>
                    </div>
                    <p class="subtitulo">Motivo de la anulación</p>
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
                            <p>Estás por anular un registro del sistema. Esta acción no eliminará el regsitro y te regresara el stock que ingreso o salio de almacen en este registro, pero asegurante de anular este registro</p>
                        </div>
                    </div>
                </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            const btnAnular = contenido.querySelector('.btn-anular-registro');
            btnAnular.addEventListener('click', confirmarAnulacion);

            async function confirmarAnulacion() {
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la anulación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/anular-movimiento/${registro.id}`, {
                        method: 'PUT', // Cambiado a PUT ya que vamos a actualizar
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            motivo,
                            estado: 'Anulado'
                        })
                    });

                    if (!response.ok) throw new Error('Error en la respuesta del servidor');

                    const data = await response.json();

                    if (data.success) {
                        await obtenerRegistrosAlmacen();
                        info(registroId);
                        updateHTMLWithData();
                        mostrarNotificacion('Se anulo el registro', { tipo: 'exito', duracion: 2000 })
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al anular el registro', { tipo: 'error' })
                } finally {
                    ocultarCarga();
                }
            }
        }
        async function copia(registro) {
            try {
                // Primero establecer el tipo de evento y esperar a que se actualice
                const tipoEvento = registro.tipo.toLowerCase() === 'ingreso' ? 'ingresos' : 'salidas';
                localStorage.setItem('tipoEventoAlmacenLocal', tipoEvento);

                const idProductos = registro.idProductos.split(';');
                const cantidades = registro.cantidades.split(';');
                const storageKey = tipoEvento === 'ingresos' ? 'damabrava_carrito_ingresos' : 'damabrava_carrito';
                const carritoCopia = new Map();

                // Guardar productos en el carrito
                for (let i = 0; i < idProductos.length; i++) {
                    carritoCopia.set(idProductos[i], {
                        id: idProductos[i],
                        cantidad: parseInt(cantidades[i])
                    });
                }

                // Guardar en localStorage
                localStorage.setItem(storageKey, JSON.stringify(Array.from(carritoCopia.entries())));

                // Mostrar notificación
                mostrarNotificacion('Se copiaron los productos al carrito', { tipo: 'exito', duracion: 2000 });

                // Cambiar vista y esperar a que se complete
                window.mostrarVistaCorrespondiente('almacen-general-cont');

                // Esperar un momento para asegurar que el localStorage se haya actualizado
                await new Promise(resolve => setTimeout(resolve, 100));

                // Forzar la recarga del tipo de evento antes de mostrar almacén
                window.tipoEvento = tipoEvento; // Si tienes acceso a la variable global

                // Mostrar almacén general
                await window.mostrarAlmacenGeneral();

            } catch (error) {
                console.error('Error al copiar productos:', error);
                mostrarNotificacion('Error al copiar productos al carrito', { tipo: 'error' });
            }
        }
    }
    aplicarFiltros();
}