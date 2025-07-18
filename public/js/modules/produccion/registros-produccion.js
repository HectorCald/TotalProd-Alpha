import { usuarioInfo } from "../../dashboard.js";
let registrosProduccion = [];
let productosGlobal = [];
let reglasProduccion = [];
let reglasBase = [];
let preciosBase = {
    etiquetado: 0.016,
    envasado: 0.048,
    sellado: 0.006,
    cernido: 0.08
};
let nombresUsuariosGlobal = [];
const DB_NAME = 'damabrava_db';
const REGISTROS_PRODUCCION = 'registros_produccion';
const NOMBRES_PRODUCCION = 'nombres_produccion';
const PRODUCTO_ALM_DB = 'prductos_alm';
const REGLAS_BASE_DB = 'reglas_produccion_base';
const REGLAS_PRODUCCION_DB = 'reglas_produccion';


async function obtenerNombresUsuarios() {
    try {
        // Primero intentar obtener del caché local
        const nombresCache = await obtenerLocal(NOMBRES_PRODUCCION, DB_NAME);

        // Si hay nombres en caché, actualizar la UI inmediatamente
        if (nombresCache.length > 0) {
            nombresUsuariosGlobal = nombresCache;
        }

        // Si no hay caché, obtener del servidor
        const response = await fetch('/obtener-nombres-usuarios');
        const data = await response.json();

        if (data.success) {
            // Procesar nombres: tomar solo la primera palabra
            const nombresProcesados = data.nombres.map(usuario => ({
                ...usuario,
                nombre: usuario.nombre.split(' ')[0] || usuario.nombre // Solo el primer nombre
            }));

            nombresUsuariosGlobal = nombresProcesados;

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(nombresCache) !== JSON.stringify(nombresProcesados)) {
                console.log('Diferencias encontradas en nombres, actualizando UI');
                updateHTMLWithData();
            }

            // Actualizar el caché en segundo plano
            (async () => {
                try {
                    const db = await initDB(NOMBRES_PRODUCCION, DB_NAME);
                    const tx = db.transaction(NOMBRES_PRODUCCION, 'readwrite');
                    const store = tx.objectStore(NOMBRES_PRODUCCION);

                    // Limpiar todos los nombres existentes
                    await store.clear();

                    // Guardar los nuevos nombres
                    for (const nombre of nombresUsuariosGlobal) {
                        await store.put({
                            id: nombre.id,
                            data: nombre,
                            timestamp: Date.now()
                        });
                    }

                    console.log('Caché de nombres actualizado correctamente');
                } catch (error) {
                    console.error('Error actualizando el caché de nombres:', error);
                }
            })();

            return true;
        }
        throw new Error('Error al obtener nombres de usuarios');
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}
async function obtenerReglasBase() {
    try {

        const reglasCache = await obtenerLocal(REGLAS_BASE_DB, DB_NAME);

        // Si hay nombres en caché, actualizar la UI inmediatamente
        if (reglasCache.length > 0) {
            reglasBase = reglasCache
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

            // Actualizar preciosBase con valores del servidor si es necesario
            reglasBase.forEach(regla => {
                if (regla.nombre === 'Etiquetado') preciosBase.etiquetado = parseFloat(regla.precio);
                if (regla.nombre === 'Envasado') preciosBase.envasado = parseFloat(regla.precio);
                if (regla.nombre === 'Sellado') preciosBase.sellado = parseFloat(regla.precio);
                if (regla.nombre === 'Cernido') preciosBase.cernido = parseFloat(regla.precio);
            });
        }

        const response = await fetch('/obtener-reglas-base');
        const data = await response.json();

        if (data.success) {
            reglasBase = data.reglasBase
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

            // Actualizar preciosBase con valores del servidor si es necesario
            reglasBase.forEach(regla => {
                if (regla.nombre === 'Etiquetado') preciosBase.etiquetado = parseFloat(regla.precio);
                if (regla.nombre === 'Envasado') preciosBase.envasado = parseFloat(regla.precio);
                if (regla.nombre === 'Sellado') preciosBase.sellado = parseFloat(regla.precio);
                if (regla.nombre === 'Cernido') preciosBase.cernido = parseFloat(regla.precio);
            });

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(reglasCache) !== JSON.stringify(reglasBase)) {
                console.log('Diferencias encontradas en reglas, actualizando UI');
                updateHTMLWithData();

                // Actualizar el caché en segundo plano
                (async () => {
                    try {
                        const db = await initDB(REGLAS_BASE_DB, DB_NAME);
                        const tx = db.transaction(REGLAS_BASE_DB, 'readwrite');
                        const store = tx.objectStore(REGLAS_BASE_DB);

                        // Limpiar todos los nombres existentes
                        await store.clear();

                        // Guardar los nuevos nombres
                        for (const item of reglasBase) {
                            await store.put({
                                id: item.id,
                                data: item,
                                timestamp: Date.now()
                            });
                        }

                        console.log('Caché de nombres actualizado correctamente');
                    } catch (error) {
                        console.error('Error actualizando el caché de nombres:', error);
                    }
                })();
            }



            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener reglas base:', error);
        return false;
    }
}
async function obtenerReglas() {
    try {
        const reglasProduccionCache = await obtenerLocal(REGLAS_PRODUCCION_DB, DB_NAME);

        if (reglasProduccionCache.length > 0) {
            reglasProduccion = reglasProduccionCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actulizando desde el cache')
        }


        const response = await fetch('/obtener-reglas');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar de más reciente a más antiguo
            reglasProduccion = data.reglas
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA; // Orden descendente por número de ID
                });

            if (JSON.stringify(reglasProduccionCache) !== JSON.stringify(reglasProduccion)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(REGLAS_PRODUCCION_DB, DB_NAME);
                        const tx = db.transaction(REGLAS_PRODUCCION_DB, 'readwrite');
                        const store = tx.objectStore(REGLAS_PRODUCCION_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of reglasProduccion) {
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
        console.error('Error las reglas', error);
        return false;
    }
}
async function obtenerRegistrosProduccion() {
    try {
        const registrosCache = await obtenerLocal(REGISTROS_PRODUCCION, DB_NAME);

        // Si hay registros en caché, actualizar la UI inmediatamente
        if (registrosCache.length > 0) {
            registrosProduccion = registrosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
        }

        const response = await fetch('/obtener-registros-produccion');
        const data = await response.json();

        if (data.success) {
            registrosProduccion = data.registros.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(registrosCache) !== JSON.stringify(registrosProduccion)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();
            }

            // Siempre actualizar el caché con los nuevos datos
            (async () => {
                try {
                    const db = await initDB(REGISTROS_PRODUCCION, DB_NAME);
                    const tx = db.transaction(REGISTROS_PRODUCCION, 'readwrite');
                    const store = tx.objectStore(REGISTROS_PRODUCCION);

                    // Limpiar todos los registros existentes
                    await store.clear();

                    // Guardar los nuevos registros
                    for (const registro of registrosProduccion) {
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
        console.error('Error al obtener registros:', error);
        return false;
    }
}
async function obtenerProductos() {
    try {
        const productosCache = await obtenerLocal(PRODUCTO_ALM_DB, DB_NAME);

        if (productosCache.length > 0) {
            console.log('productoscache')
            productosGlobal = productosCache.sort((a, b) => {
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
                productosGlobal = data.productos.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });
                if (JSON.stringify(productosCache) !== JSON.stringify(productosGlobal)) {
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
                            for (const item of productosGlobal) {
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


export async function mostrarVerificacion() {
    renderInitialHTML();
    const [nombres, productos, reglasBase, reglasProduccion, registros] = await Promise.all([
        obtenerNombresUsuarios(),
        obtenerProductos(),
        obtenerReglasBase(),
        obtenerReglas(),
        await obtenerRegistrosProduccion(),
    ]);
}
function renderInitialHTML() {
    const view = document.querySelector('.registros-produccion-cont');
    const initialHTML = `
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo" style="width:100%">Registros producción</p>
                </div>
                <div class="botones-container">
                    ${usuarioInfo.rol === 'Administración' ? `<button class="nuevo-pago btn orange"><i class='bx bx-dollar-circle'></i></button>` : ''} 
                </div>
            </div>
            <div class="buscador-view">
                <button class="lupa"><i class='bx bx-search'></i></button>
                <input type="text" class="search" placeholder="Buscar...">
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
                <button class="limpiar-search" style="right:45px"><i class='bx bx-x'></i></button>
            </div>
            <div class="filtros-view etiquetas-filter" style="padding:0">
                <button class="btn-filtro activado" data-user="Todos">Todos</button>
                ${Array(5).fill().map(() => `
                    <div class="skeleton skeleton-etiqueta"></div>
                `).join('')}
            </div>
            <div class="filtros-view estado"style="padding:0">
                <button class="btn-filtro activo">Todos</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Verificados</button>
                <button class="btn-filtro">Observados</button>
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
    // 2. Obtener usuarios únicos de los registros
    const usuariosUnicos = [...new Set(registrosProduccion.map(registro => registro.user))];

    // 3. Mapear cada user a su nombre correspondiente
    const etiquetasFilter = document.querySelector('.etiquetas-filter');
    const etiquetasHTML = usuariosUnicos.map(user => {
        // Buscar el usuario en nombresUsuariosGlobal (ya procesado con solo primer nombre)
        const usuario = nombresUsuariosGlobal.find(u => u.user === user);

        // Si no encontramos el usuario, intentar buscar por el nombre del registro
        if (!usuario) {
            const registro = registrosProduccion.find(r => r.user === user);
            if (registro) {
                // Procesar el nombre del registro también
                const primerNombre = registro.nombre.split(' ')[0] || 'Sin nombre';
                return `<button class="btn-filtro" data-user="${user}">${primerNombre}</button>`;
            }
        }

        // Usar el nombre ya procesado del caché
        const primerNombre = usuario?.nombre || 'Sin nombre';
        return `<button class="btn-filtro" data-user="${user}">${primerNombre}</button>`;
    }).join('');

    // 4. Insertar en el DOM
    etiquetasFilter.innerHTML = `
        <button class="btn-filtro activado" data-user="Todos">Todos</button>
        ${etiquetasHTML}
    `;


    const productosContainer = document.querySelector('.registros-produccion-cont .contenido-view');
    const registrosLimitados = registrosProduccion.slice(0, 200);
    const productosHTML = registrosLimitados.map(registro => `
        <div class="item-view" data-id="${registro.id}">
            <div class="header-view">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${registro.nombre.split(" ").slice(0, 2).join(" ")}</span><span class="flotante-view ${registro.fecha_verificacion && registro.observaciones === 'Sin observaciones' ? 'green' : registro.observaciones !== 'Sin observaciones' && registro.fecha_verificacion ? 'orange' : 'gray'}">${registro.fecha_verificacion && registro.observaciones === 'Sin observaciones' ? 'Verificado' : registro.observaciones !== 'Sin observaciones' && registro.fecha_verificacion ? 'Observado' : 'Pendiente'}</span></span>
                    <span class="detalle">${registro.producto} - ${registro.gramos}gr.</span>
                    <span class="pie">${registro.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');


    const showMoreButton = registrosProduccion.length > 250 ? `
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
    eventosVerificacion();
}


function eventosVerificacion() {
    const btnNuevoPagoGenerico = document.querySelector('.nuevo-pago');

    const botonesNombre = document.querySelectorAll('.etiquetas-filter .btn-filtro');
    const botonesEstado = document.querySelectorAll('.estado .btn-filtro');

    const items = document.querySelectorAll('.item-view');
    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');
    const btnLimpiar = document.querySelector('.limpiar-search');


    function cargarMasRegistros() {
        const productosContainer = document.querySelector('.contenido-view');
        const currentItems = document.querySelectorAll('.item-view').length;
        const nextBatch = registrosProduccion.slice(currentItems, currentItems + 50);

        if (nextBatch.length > 0) {
            const newItemsHTML = nextBatch.map(registro => `
                <div class="item-view" data-id="${registro.id}">
                    <div class="header-view">
                        <i class='bx bx-file'></i>
                        <div class="info-header">
                            <span class="id-flotante"><span class="id">${registro.nombre.split(" ").slice(0, 2).join(" ")}</span><span class="flotante-view ${registro.fecha_verificacion && registro.observaciones === 'Sin observaciones' ? 'green' : registro.observaciones !== 'Sin observaciones' && registro.fecha_verificacion ? 'orange' : 'gray'}">${registro.fecha_verificacion && registro.observaciones === 'Sin observaciones' ? 'Verificado' : registro.observaciones !== 'Sin observaciones' && registro.fecha_verificacion ? 'Observado' : 'Pendiente'}</span></span>
                            <span class="detalle"><strong>${registro.producto} - ${registro.gramos}gr.</strong></span>
                            <span class="pie">${registro.fecha}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Remove the show more button
            const showMoreContainer = document.querySelector('.show-more-container');
            if (showMoreContainer) {
                showMoreContainer.remove();
            }

            // Add new items
            productosContainer.insertAdjacentHTML('beforeend', newItemsHTML);

            // Add show more button again if there are more records
            if (currentItems + nextBatch.length < registrosProduccion.length) {
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

                // Reattach event listeners to the new buttons
                document.querySelector('.show-more').addEventListener('click', cargarMasRegistros);
                document.querySelector('.show-all').addEventListener('click', cargarTodosLosRegistros);
                aplicarFiltros();
            }

            // Reattach event listeners to new items
            const newItems = document.querySelectorAll('.registro-item');
            newItems.forEach(item => {
                item.addEventListener('click', function () {
                    const registroId = this.dataset.id;
                    window.info(registroId);
                });
            });
        }
    }
    function cargarTodosLosRegistros() {
        const productosContainer = document.querySelector('.contenido-view');
        const currentItems = document.querySelectorAll('.item-view').length;
        const remainingRecords = registrosProduccion.slice(currentItems);

        if (remainingRecords.length > 0) {
            const newItemsHTML = remainingRecords.map(registro => `
                <div class="item-view" data-id="${registro.id}">
                    <div class="header-view">
                        <i class='bx bx-file'></i>
                        <div class="info-header">
                            <span class="id-flotante"><span class="id">${registro.nombre.split(" ").slice(0, 2).join(" ")}</span><span class="flotante-view ${registro.fecha_verificacion && registro.observaciones === 'Sin observaciones' ? 'green' : registro.observaciones !== 'Sin observaciones' && registro.fecha_verificacion ? 'orange' : 'gray'}">${registro.fecha_verificacion && registro.observaciones === 'Sin observaciones' ? 'Verificado' : registro.observaciones !== 'Sin observaciones' && registro.fecha_verificacion ? 'Observado' : 'Pendiente'}</span></span>
                            <span class="detalle"><strong>${registro.producto} - ${registro.gramos}gr.</strong></span>
                            <span class="pie">${registro.fecha}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Remove the buttons container
            const showMoreContainer = document.querySelector('.show-more-container');
            if (showMoreContainer) {
                showMoreContainer.remove();
            }

            // Add all remaining items
            productosContainer.insertAdjacentHTML('beforeend', newItemsHTML);
            aplicarFiltros();

            // Reattach event listeners to new items
            const newItems = document.querySelectorAll('.registro-item');
            newItems.forEach(item => {
                item.addEventListener('click', function () {
                    const registroId = this.dataset.id;
                    window.info(registroId);
                });
            });
        }
    }
    function toggleLimpiarBtn() {
        if (inputBusqueda.value.trim() !== '') {
            btnLimpiar.style.display = 'block';
        } else {
            btnLimpiar.style.display = 'none';
        }
    }

    // Add event listeners to initial buttons
    const showMoreBtn = document.querySelector('.show-more');
    const showAllBtn = document.querySelector('.show-all');

    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', cargarMasRegistros);
    }

    if (showAllBtn) {
        showAllBtn.addEventListener('click', cargarTodosLosRegistros);
    }


    let filtroFechaInstance = null;
    let filtroNombreActual = localStorage.getItem('filtroNombresProduccion') === 'undefined' ? 'Todos' : localStorage.getItem('filtroNombresProduccion');
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
            const registroData = registrosProduccion.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Lógica de filtrado existente
            if (filtroEstadoActual && filtroEstadoActual !== 'Todos') {
                if (filtroEstadoActual === 'Pendientes') {
                    mostrar = !registroData.fecha_verificacion;
                } else if (filtroEstadoActual === 'Verificados') {
                    mostrar = !!registroData.fecha_verificacion;
                } else if (filtroEstadoActual === 'Observados') {
                    mostrar = registroData.fecha_verificacion && registroData.observaciones !== 'Sin observaciones';
                }
            }

            if (mostrar && filtroNombreActual && filtroNombreActual !== 'Todos') {
                mostrar = registroData.user === filtroNombreActual;
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
                    registroData.gramos?.toString(),
                    registroData.lote?.toString(),
                    registroData.fecha,
                    registroData.nombre,
                    registroData.proceso
                ].filter(Boolean).join(' ').toLowerCase();

                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

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

    botonesNombre.forEach(boton => {
        boton.classList.remove('activo');
        if (filtroNombreActual !== 'todos') {
            if (boton.dataset.user === filtroNombreActual) {
                boton.classList.add('activo');
            }
        }
        boton.addEventListener('click', () => {
            botonesNombre.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
            filtroNombreActual = boton.dataset.user;
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
            localStorage.setItem('filtroNombresProduccion', filtroNombreActual);
        });
    });
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
                        botonCalendario.classList.remove('con-fecha');
                    }
                }
            });
        }
        filtroFechaInstance.open();
    });


    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });
    inputBusqueda.addEventListener('input', (e) => {
        toggleLimpiarBtn();
        aplicarFiltros();
    });
    btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.focus();
        toggleLimpiarBtn();
        aplicarFiltros();
    });



    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });
    window.info = async function (registroId) {
        const registro = registrosProduccion.find(r => r.id === registroId);
        if (!registro) return;


        const producto = productosGlobal.find(p => p.id === registro.idProducto);
        const cantidadPorGrupo = producto ? producto.cantidadxgrupo : 1;
        const numeroADividir = registro.fecha_verificacion ? registro.c_real : registro.envases_terminados;
        const tirasCompletas = Math.floor(numeroADividir / cantidadPorGrupo);
        const unidadesSueltas = numeroADividir % cantidadPorGrupo;
        const unidadesTira = producto ? (cantidadPorGrupo <= 1 ? `${tirasCompletas} und.` : `${tirasCompletas} tiras`) : 'N/A';

        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Información</p>
                    </div>
                    <div class="botones-container">
                        ${tienePermiso('edicion') && !registro.fecha_verificacion ? `<button class="btn-editar btn blue" data-id="${registro.id}"><i class='bx bx-edit'></i></button>` : ''}
                        ${tienePermiso('eliminacion') && !registro.fecha_verificacion ? `<button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i></button>` : ''}
                        ${tienePermiso('anulacion') && registro.fecha_verificacion ? `<button class="btn-anular btn orange" data-id="${registro.id}"><i class='bx bx-x-circle'></i>Anular</button>` : ''}
                        ${!registro.fecha_verificacion ? `<button class="btn-verificar btn green" data-id="${registro.id}"><i class='bx bx-check-circle'></i></button>` : ''}
                        ${registro.observaciones !== 'Sin observaciones' && registro.observaciones !== '' && registro.fecha_verificacion ? `<button class="btn-arreglado btn blue" data-id="${registro.id}"><i class='bx bx-check-circle'></i></button>` : ''}
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Información del producto</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-box'></i> Producto: </span>${registro.producto}</div>
                    <div class="detalle-campo"><span><i class="ri-scales-line"></i> Gramaje: </span>${registro.gramos}gr.</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Envases: </span>${registro.envases_terminados} Und.</div>
                    <div class="detalle-campo"><span><i class='bx bx-hash'></i> Vencimiento: </span>${registro.fecha_vencimiento}</div>
                </div>

                <p class="subtitulo">Información básica</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-user'></i> Operador: </span>${registro.nombre}</div>
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                </div>

                <p class="subtitulo">Detalles de producción</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-cog'></i> Selección/Cernido: </span>${registro.proceso}</div>
                    <div class="detalle-campo"><span><i class='bx bx-bowl-hot'></i> Microondas: </span>${registro.microondas}</div>
                    <div class="detalle-campo"><span><i class='bx bx-check-shield'></i> Envases terminados: </span>${registro.envases_terminados}</div>
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha de vencimiento: </span>${registro.fecha_vencimiento}</div>
                </div>

                <p class="subtitulo">Detalles de verificación</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-transfer'></i> Verificado:</span> ${registro.fecha_verificacion ? `${registro.c_real} Und.` : 'Pendiente'}</div>
                    ${registro.fecha_verificacion ? `<div class="detalle-campo"><span><i class='bx bx-calendar-check'></i> Fecha verificación:</span> ${registro.fecha_verificacion}</div>` : ''}
                    ${registro.fecha_verificacion ? `<div class="detalle-campo"><span><i class='bx bx-box'></i> Cantidad</span> ${unidadesTira}</div>` : ''}
                    ${registro.fecha_verificacion ? `<div class="detalle-campo"><span><i class='bx bx-box'></i> Sueltos:</span> ${unidadesSueltas} und.</div>` : ''}
                    ${registro.observaciones ? `<div class="detalle-campo"><span><i class='bx bx-comment-detail'></i>Observaciones: </span> ${registro.observaciones}</div>` : ''}
                </div>
                
                ${registro.fecha_verificacion && usuarioInfo.rol === 'Administración' ? `
                    ${(() => {
                        const calculado = calcularTotal(registro);
                        return `
                    <p class="subtitulo">Detalles de pago</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-dollar'></i> Envasado:</span> Bs.${calculado.envasado.toFixed(2)}</div>
                        <div class="detalle-campo"><span><i class='bx bx-dollar'></i> Etiquetado:</span> Bs.${calculado.etiquetado.toFixed(2)}</div>
                        <div class="detalle-campo"><span><i class='bx bx-dollar'></i> Sellado:</span> Bs.${calculado.sellado.toFixed(2)}</div>
                        <div class="detalle-campo"><span><i class='bx bx-dollar'></i> Cernido:</span> Bs.${calculado.cernido.toFixed(2)}</div>
                        <div class="detalle-campo"><span><i class='bx bx-dollar'></i> Total:</span> Bs.${calculado.total.toFixed(2)}</div>
                    </div>`;
                    })()}
                ` : ''}
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        const btnVerificar = contenido.querySelector('.btn-verificar');
        const btnArreglado = contenido.querySelector('.btn-arreglado');


        if (tienePermiso('edicion') && !registro.fecha_verificacion) {
            const btnEditar = contenido.querySelector('.btn-editar');
            btnEditar.addEventListener('click', () => editar(registro));
        }
        if (tienePermiso('eliminacion') && !registro.fecha_verificacion) {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }
        if (tienePermiso('anulacion') && registro.fecha_verificacion) {
            const btnAnular = contenido.querySelector('.btn-anular');
            btnAnular.addEventListener('click', () => anular(registro));
        }
        if (btnVerificar) {
            btnVerificar.addEventListener('click', () => verificar(registro));
        }
        if (btnArreglado) {
            btnArreglado.addEventListener('click', () => arreglado(registro));
        }


        function eliminar(registro) {

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
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Producto: </span>${registro.producto}</div>
                        <div class="detalle-campo"><span><i class="ri-scales-line"></i> Gramaje: </span>${registro.gramos}gr.</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Envases: </span>${registro.envases_terminados} Und.</div>
                        <div class="detalle-campo"><span><i class='bx bx-hash'></i> Vencimiento: </span>${registro.fecha_vencimiento}</div>
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
                    mostrarNotificacion('Ingresa el motivo de la eliminación');
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/eliminar-registro-produccion/${registroId}`, {
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
                        await obtenerRegistrosProduccion();
                        cerrarAnuncioManual('anuncioSecond');
                        updateHTMLWithData();
                        ocultarScreen();
                        mostrarNotificacion('Se elimino el registro', { tipo: 'exito', duracion: 2000 })
                    } else {
                        mostrarNotificacion('Error al eliminar el registro', { tipo: 'error' })
                        throw new Error(data.error || 'Error al eliminar el registro');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al eliminar el registro', { tipo: 'error' })
                } finally {
                    ocultarCarga();
                }
            }
        }
        function editar(registro) {

            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Editar registro</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-editar-registro btn blue"><i class="bx bx-save"></i> Guardar</button>
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <p class="subtitulo">Información basica</p>
                        <div class="entrada">
                            <i class='bx bx-cube'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input class="producto" type="text" value="${registro.producto}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="sugerencias" id="productos-list"></div>
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class="ri-scales-line"></i>
                                <div class="input">
                                    <p class="detalle">Gramaje</p>
                                    <input class="gramaje" type="number" value="${registro.gramos}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-barcode'></i>
                                <div class="input">
                                    <p class="detalle">Lote</p>
                                    <input class="lote" type="number" autocomplete="off" value="${registro.lote}" placeholder=" " required>
                                </div>
                            </div>
                        </div>
                        
                    <p class="subtitulo">Información del proceso</p>
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class='bx bx-cog'></i>
                                <div class="input">
                                    <p class="detalle">Proceso</p>
                                    <select class="select" required>
                                        <option value="${registro.proceso}" selected>${registro.proceso}</option>
                                        <option value="Seleccion">Selección</option>
                                        <option value="Cernido">Cernido</option>
                                        <option value="Ninguno">Ninguno</option>
                                    </select>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-bowl-hot'></i>
                                <div class="input">
                                    <p class="detalle">Microondas</p>
                                    <input class="microondas" type="text" value="${registro.microondas}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                        </div>
                    <p class="subtitulo">Información del acabado</p>
                        <div class="entrada">
                            <i class='bx bx-check-shield'></i>
                            <div class="input">
                                <p class="detalle">Terminados</p>
                                <input class="terminados" type="number" value="${registro.envases_terminados}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-calendar'></i>
                            <div class="input">
                                <p class="detalle">vencimiento</p>
                                <input class="vencimiento" type="month" value="${registro.fecha_vencimiento}" placeholder=" " required>
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
                                <p>Estás por editar un registro del sistema. Asegúrate de realizar los cambios correctamente, ya que podrían modificar información relacionada.</p>
                            </div>
                        </div>

                </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            const productoInput = document.querySelector('.entrada .producto');
            const sugerenciasList = document.querySelector('#productos-list');
            const gramajeInput = document.querySelector('.entrada .gramaje');

            function normalizarTexto(texto) {
                return texto
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
                    .replace(/[-\s]+/g, ""); // Eliminar guiones y espacios
            }
            productoInput.addEventListener('input', (e) => {
                const valor = normalizarTexto(e.target.value);

                sugerenciasList.innerHTML = '';

                if (valor) {
                    const sugerencias = productosGlobal.filter(p =>
                        normalizarTexto(p.producto).includes(valor)
                    ).slice(0, 5);

                    if (sugerencias.length) {
                        sugerenciasList.style.display = 'flex';
                        sugerencias.forEach(p => {
                            const div = document.createElement('div');
                            div.classList.add('item');
                            div.textContent = p.producto + ' ' + p.gramos + 'gr.';
                            div.onclick = () => {
                                productoInput.value = p.producto;
                                sugerenciasList.style.display = 'none';
                                gramajeInput.value = p.gramos;
                                window.idPro = p.id;
                                const event = new Event('focus');
                                gramajeInput.dispatchEvent(event);
                            };
                            sugerenciasList.appendChild(div);
                        });
                    }
                } else {
                    sugerenciasList.style.display = 'none';
                }
            });
            const btnEditar = contenido.querySelector('.btn-editar-registro');
            btnEditar.addEventListener('click', confirmarEdicion);

            async function confirmarEdicion() {
                const idProdducto = window.idPro;
                const producto = document.querySelector('.producto').value;
                const gramos = document.querySelector('.gramaje').value;
                const lote = document.querySelector('.lote').value;
                const proceso = document.querySelector('.select').value;
                const microondas = document.querySelector('.microondas').value;
                const envases_terminados = document.querySelector('.terminados').value;
                const fecha_vencimiento = document.querySelector('.vencimiento').value;
                const motivo = document.querySelector('.motivo').value;
                if (!motivo) { // Solo el campo "Motivo" es obligatorio
                    mostrarNotificacion('Ingresa el motivo de la edición')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/editar-registro-produccion/${registroId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idPro: idProdducto,
                            producto,
                            gramos,
                            lote,
                            proceso,
                            microondas,
                            envases_terminados,
                            fecha_vencimiento,
                            motivo
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerRegistrosProduccion();
                        info(registroId);
                        updateHTMLWithData();
                        mostrarNotificacion('Se actualizo el registro', { tipo: 'exito', duracion: 2000 })
                    } else {
                        mostrarNotificacion('Error al actualizar', { tipo: 'error' })
                        throw new Error(data.error || 'Error al actualizar el registro');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al actualizar', { tipo: 'error' })
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
                            <p class="titulo">Anular verificación</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-anular-verificacion btn red"><i class='bx bx-x-circle'></i> Anular</button>
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <p class="subtitulo">Información del registro</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Producto: </span>${registro.producto}</div>
                        <div class="detalle-campo"><span><i class="ri-scales-line"></i> Gramaje: </span>${registro.gramos}gr.</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Envases: </span>${registro.envases_terminados} Und.</div>
                        <div class="detalle-campo"><span><i class='bx bx-hash'></i> Vencimiento: </span>${registro.fecha_vencimiento}</div>
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
                            <p>Estás por anular verificación de un registro del sistema. Esta acción no lo eliminará, pero quitara la fecha y la cantidad verificada, esto prodria afectar al peso de dicho producto en almacen acopio.</p>
                        </div>
                    </div>

                </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            const btnAnularVerificacion = contenido.querySelector('.btn-anular-verificacion');
            btnAnularVerificacion.addEventListener('click', confirmarAnulacion);

            async function confirmarAnulacion() {
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la anulación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/anular-verificacion-produccion/${registro.id}`, {
                        method: 'PUT',
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
                        await obtenerRegistrosProduccion();
                        info(registroId);
                        updateHTMLWithData();
                        mostrarNotificacion('Se anulo la verificación', { tipo: 'exito', duracion: 2000 })
                    } else {
                        mostrarNotificacion('Error al anular la verificación', { tipo: 'error' })
                        throw new Error(data.error || 'Error al anular la verificación');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al anular la verificación', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }
        function verificar(registro) {

            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Verificar registro</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-verificar-registro btn green"><i class='bx bx-check-circle'></i> Finalizar</button>
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                <p class="subtitulo">Información básica</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Producto: </span>${registro.producto}</div>
                        <div class="detalle-campo"><span><i class="ri-scales-line"></i> Gramaje: </span>${registro.gramos}gr.</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Envases: </span>${registro.envases_terminados} Und.</div>
                        <div class="detalle-campo"><span><i class='bx bx-hash'></i> Vencimiento: </span>${registro.fecha_vencimiento}</div>
                    </div>
                    <p class="subtitulo">Verificación</p>
                    <div class="entrada">
                        <i class='bx bx-hash'></i>
                        <div class="input">
                            <p class="detalle">Cantidad real</p>
                            <input class="cantidad_real" type="number" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="observaciones" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por verificar un registro del sistema. Esta acción restara el peso de la cantidad verificada por el gramaje de dicho producto en almacen acopio, asegurate de ingresar la cantidad correcta para evitar anulaciones posteriores.</p>
                        </div>
                    </div>

                </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            // Agregar evento al botón guardar
            const btnVerificar = contenido.querySelector('.btn-verificar-registro');
            btnVerificar.addEventListener('click', confirmarVerificacion);

            async function confirmarVerificacion() {
                const cantidadRealInput = document.querySelector('.verificar-registro .cantidad_real');
                const observacionesInput = document.querySelector('.verificar-registro .observaciones');

                if (!cantidadRealInput || !observacionesInput) {
                    return;
                }

                const cantidadReal = cantidadRealInput.value.trim();
                const observaciones = observacionesInput.value.trim();

                if (!cantidadReal) {
                    mostrarNotificacion('Ingresa la cantidad real')
                    return;
                }

                try {
                    mostrarCarga();
                    const registro = registrosProduccion.find(r => r.id === registroId);

                    const response = await fetch(`/verificar-registro-produccion/${registroId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            cantidad_real: cantidadReal,
                            observaciones: observaciones || 'Sin observaciones'
                        })
                    });

                    if (!response.ok) {
                        if (error.response && error.response.data && error.response.data.error === 'No hay suficiente stock en los lotes de acopio') {
                            mostrarNotificacion('No hay sufiente peso en acopio')
                        } else {
                            mostrarNotificacion('No hay suficiente peso en acopio')
                        }
                        ocultarCarga();
                        return;
                    }

                    const data = await response.json();

                    if (data.success) {
                        await mostrarIngresos(registro.idProducto);
                    } else {
                        mostrarNotificacion('Error al verificar', { tipo: 'error' })
                        throw new Error(data.error || 'Error al verificar el registro');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al verificar', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }
        async function arreglado(registro) {
            try {
                mostrarCarga();
                const response = await fetch(`/actualizar-observaciones-registro/${registro.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        observaciones: 'Sin observaciones'
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    await obtenerRegistrosProduccion();
                    info(registroId);
                    updateHTMLWithData();
                    mostrarNotificacion('Se marco como arreglado', { tipo: 'exito', duracion: 2000 })
                } else {
                    mostrarNotificacion('Error al marcar como arreglado', { tipo: 'error' })
                    throw new Error(data.error || 'Error al marcar como arreglado');
                }
            } catch (error) {
                mostrarNotificacion('Error al marcar como arreglado', { tipo: 'error' })
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        }

    }
    btnNuevoPagoGenerico.addEventListener('click', () => mostrarFormularioNuevoPago());

    function calcularTotal(registro) {
        // Declarar todas las variables necesarias
        const normalizedNombre = normalizarTexto(registro.producto);
        const cantidad = parseFloat(registro.c_real) || 0;
        const gramaje = parseFloat(registro.gramos) || 0;
        const seleccion = registro.proceso || 'Ninguno';

        // AÑADE ESTA LÍNEA:
        const producto = registro.producto;

        let multiplicadores = {
            etiquetado: '1',
            sellado: '1',
            envasado: '1',
            cernido: preciosBase.cernido
        };

        // Primero buscar reglas por gramaje
        const reglasGramaje = reglasProduccion?.filter(r => {
            if (r.producto.startsWith('Regla ') && r.producto.includes('gr-')) {
                // Extraer rango y producto (si existe)
                const match = r.producto.match(/^Regla\s*(\d+)gr-(\d+)gr(?:\((.+)\))?$/i);
                if (!match) return false;

                const minGr = parseInt(match[1]);
                const maxGr = parseInt(match[2]);
                const productoEspecifico = match[3]?.trim();

                // Si hay producto específico, debe coincidir exactamente (ignora mayúsculas/minúsculas y espacios)
                if (productoEspecifico) {
                    return (
                        gramaje >= minGr &&
                        gramaje <= maxGr &&
                        normalizarTexto(producto) === normalizarTexto(productoEspecifico)
                    );
                } else {
                    // Si no hay producto específico, solo filtra por rango
                    return gramaje >= minGr && gramaje <= maxGr;
                }
            }
            return false;
        }) || [];

        // Si encontramos reglas por gramaje, usamos la primera
        if (reglasGramaje.length > 0) {
            const reglaGramaje = reglasGramaje[0];
            multiplicadores = {
                etiquetado: reglaGramaje.etiq || '1',
                sellado: reglaGramaje.sell || '1',
                envasado: reglaGramaje.envs || '1',
                cernido: reglaGramaje.cern || preciosBase.cernido
            };
        } else {
            // Si no hay reglas por gramaje, buscar reglas por nombre
            const reglasPorProducto = reglasProduccion?.filter(r => {
                const nombreRegla = normalizarTexto(r.producto);
                return normalizedNombre === nombreRegla || normalizedNombre.includes(nombreRegla);
            }) || [];

            // Aplicar reglas por producto si existen
            if (reglasPorProducto.length > 0) {
                const regla = reglasPorProducto[0];
                multiplicadores = {
                    etiquetado: regla.etiq || '1',
                    sellado: regla.sell || '1',
                    envasado: regla.envs || '1',
                    cernido: regla.cern || preciosBase.cernido
                };
            }
        }

        // Calcular resultados usando preciosBase
        let resultado = cantidad * preciosBase.envasado * parseFloat(multiplicadores.envasado);
        let resultadoEtiquetado = cantidad * preciosBase.etiquetado * parseFloat(multiplicadores.etiquetado);
        let resultadoSellado = cantidad * preciosBase.sellado * parseFloat(multiplicadores.sellado);


        let resultadoSernido = 0;
        if (seleccion === 'Cernido') {
            const kilos = (cantidad * gramaje) / 1000;
            resultadoSernido = (kilos * parseFloat(multiplicadores.cernido)) * 5;
        }

        return {
            total: resultado + resultadoEtiquetado + resultadoSellado + resultadoSernido,
            envasado: resultado,
            etiquetado: resultadoEtiquetado,
            sellado: resultadoSellado,
            cernido: resultadoSernido
        };
    }
    window.calcularTotal = calcularTotal;
    async function mostrarFormularioNuevoPago() {
        const itemsVisibles = Array.from(document.querySelectorAll('.item-view:not([style*="display: none"])'));
        const registrosFiltrados = itemsVisibles.map(item =>
            registrosProduccion.find(r => r.id === item.dataset.id)
        ).filter(r => r);

        // Usar la función global calcularTotal para generar la vista previa
        const vistaPrevia = registrosFiltrados.map(registro => {
            const calculado = calcularTotal(registro);
            return `
            <tr>
                <td>${registro.nombre}</td>
                <td>${registro.producto}</td>
                <td>${registro.gramos}</td>
                <td>${registro.c_real}</td>
                <td>${calculado.cernido.toFixed(2)}</td>
                <td>${calculado.envasado.toFixed(2)}</td>
                <td>${calculado.etiquetado.toFixed(2)}</td>
                <td>${calculado.sellado.toFixed(2)}</td>
                <td><strong>${calculado.total.toFixed(2)}</strong></td>
            </tr>
        `;
        }).join('');
        const totales = registrosFiltrados.reduce((acc, registro) => {
            const calculado = calcularTotal(registro);
            return {
                cernido: acc.cernido + calculado.cernido,
                envasado: acc.envasado + calculado.envasado,
                etiquetado: acc.etiquetado + calculado.etiquetado,
                sellado: acc.sellado + calculado.sellado,
                total: acc.total + calculado.total
            };
        }, { cernido: 0, envasado: 0, etiquetado: 0, sellado: 0, total: 0 });

        // Modificar la parte de la tabla para incluir los totales
        const tablaHTML = `
    <div class="tabla-responsive">
        <table>
            <thead>
                <tr>
                    <th>Operador</th>
                    <th>Producto</th>
                    <th>Gramaje</th>
                    <th>Cantidad verf.</th>
                    <th>Cernido</th>
                    <th>Envasado</th>
                    <th>Etiquetado</th>
                    <th>Sellado</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${vistaPrevia}
                <tr class="totales" style="background-color: rgba(0,0,0,0.1); font-weight: bold;">
                    <td colspan="4" style="text-align: right;">TOTALES:</td>
                    <td>${totales.cernido.toFixed(2)}</td>
                    <td>${totales.envasado.toFixed(2)}</td>
                    <td>${totales.etiquetado.toFixed(2)}</td>
                    <td>${totales.sellado.toFixed(2)}</td>
                    <td><strong>${totales.total.toFixed(2)}</strong></td>
                </tr>
                <tr class="totales-ajustados" style="background-color: rgba(0,0,0,0.15); font-weight: bold;">
                    <td colspan="4" style="text-align: right;">TOTAL AJUSTADO:</td>
                    <td colspan="4" style="text-align: right;">
                        Aumentos: +<span class="aumento-preview">0.00</span> | 
                        Descuentos: -<span class="descuento-preview">0.00</span>
                    </td>
                    <td><strong><span class="total-final-preview">${totales.total.toFixed(2)}</span></strong></td>
                </tr>
            </tbody>
        </table>
    </div>`;

        // Calcular el subtotal general usando la misma función
        const subtotalGeneral = registrosFiltrados.reduce((total, registro) => {
            const calculado = calcularTotal(registro);
            return total + calculado.total;
        }, 0);

        // Obtener nombres únicos para el select de beneficiarios
        const nombresUnicos = [...new Set(registrosFiltrados.map(r => r.nombre))];

        const contenido = document.querySelector('.screen2');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Nuevo pago</p>
                    </div>
                    <div class="botones-container">
                        <button type="submit" class="btn orange"><i class='bx bx-dollar-circle'></i> Registrar</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información general del pago</p>
                <div class="entrada">
                    <i class='bx bx-rename'></i>
                    <div class="input">
                        <p class="detalle">Nombre del pago</p>
                        <input type="text" name="nombre_pago" required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-user'></i>
                    <div class="input">
                        <p class="detalle">Beneficiario</p>
                        <select name="beneficiario" id="select-beneficiario">
                            <option value=""></option>
                            ${nombresUnicos.map(n => `<option value="${n}">${n}</option>`).join('')}
                        </select>
                        <input type="text" name="beneficiario_personalizado" id="beneficiario-personalizado" style="display:none;" placeholder="Nombre personalizado">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-user-check'></i>
                    <div class="input">
                        <p class="detalle">Pagado por</p>
                        <input type="text" name="pagado_por" value="${usuarioInfo.nombre + ' ' + usuarioInfo.apellido}" readonly>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-file'></i>
                    <div class="input">
                        <p class="detalle">Justificativos</p>
                        <input name="justificativos" rows="2" readonly value="${registrosFiltrados.map(r => r.id).join(', ')}">
                    </div>
                </div>
                <div class="campo-horizontal">
                    <div class="entrada">
                        <i class='bx bx-calculator'></i>
                        <div class="input">
                            <p class="detalle">Subtotal</p>
                            <input type="number" name="subtotal" required value="${subtotalGeneral.toFixed(2)}">
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-minus-circle'></i>
                        <div class="input">
                            <p class="detalle">Descuento</p>
                            <input type="number" name="descuento" value="0">
                        </div>
                    </div>
                </div>
                <div class="campo-horizontal">
                    <div class="entrada">
                        <i class='bx bx-plus-circle'></i>
                        <div class="input">
                            <p class="detalle">Aumento</p>
                            <input type="number" name="aumento" value="0">
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-dollar-circle'></i>
                        <div class="input">
                            <p class="detalle">Total</p>
                            <input type="number" name="total" required value="${subtotalGeneral.toFixed(2)}">
                        </div>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Observaciones</p>
                        <input type="text" name="observaciones">
                    </div>
                </div>
                <p class="subtitulo">Vista previa de registros incluidos</p>
                ${tablaHTML}
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen2();


        // Actualizar los eventos de los inputs para reflejar los cambios en tiempo real
        const actualizarTotalesPreview = () => {
            const descuento = parseFloat(document.querySelector('input[name="descuento"]').value) || 0;
            const aumento = parseFloat(document.querySelector('input[name="aumento"]').value) || 0;
            const totalFinal = totales.total + aumento - descuento;

            document.querySelector('.descuento-preview').textContent = descuento.toFixed(2);
            document.querySelector('.aumento-preview').textContent = aumento.toFixed(2);
            document.querySelector('.total-final-preview').textContent = totalFinal.toFixed(2);
            document.querySelector('input[name="total"]').value = totalFinal.toFixed(2);
        };

        // Agregar los event listeners después de mostrar la tabla
        const addEventListeners = () => {
            const inputs = contenido.querySelectorAll('input[name="descuento"], input[name="aumento"]');
            inputs.forEach(input => {
                input.addEventListener('input', actualizarTotalesPreview);
            });
        };
        addEventListeners();

        const selectBenef = contenido.querySelector('#select-beneficiario');
        const inputPersonalizado = contenido.querySelector('#beneficiario-personalizado');
        selectBenef.addEventListener('change', function () {
            if (this.value === 'otro') {
                inputPersonalizado.style.display = 'block';
                inputPersonalizado.required = true;
            } else {
                inputPersonalizado.style.display = 'none';
                inputPersonalizado.required = false;
            }
        });
        const inputs = contenido.querySelectorAll('input[name="subtotal"], input[name="descuento"], input[name="aumento"]');
        inputs.forEach(input => {
            input.addEventListener('input', calcularTotal);
        });

        const btnGuardar = contenido.querySelector('button[type="submit"]');
        btnGuardar.addEventListener('click', guardarPago);

        async function guardarPago(e) {
            e.preventDefault();

            // Obtener solo las filas de productos (excluir las filas de totales)
            const filasTabla = Array.from(document.querySelectorAll('table tbody tr'))
                .filter(fila => !fila.classList.contains('totales') && !fila.classList.contains('totales-ajustados'));

            const justificativosDetallados = filasTabla.map(fila => {
                try {
                    const producto = fila.cells[1].textContent; // Columna Producto
                    const gramaje = fila.cells[2].textContent; // Columna Gramaje
                    const cernido = fila.cells[4].textContent; // Columna Cernido
                    const envasado = fila.cells[5].textContent; // Columna Envasado
                    const etiquetado = fila.cells[6].textContent; // Columna Etiquetado
                    const sellado = fila.cells[7].textContent; // Columna Sellado

                    // Retornar string con producto y valores de la tabla
                    return `${producto} ${gramaje}gr(${envasado},${etiquetado},${sellado},${cernido})`;
                } catch (error) {
                    console.warn('Error procesando fila:', error);
                    return '';
                }
            }).filter(Boolean).join(';');

            const formData = {
                nombre_pago: contenido.querySelector('input[name="nombre_pago"]').value.trim(),
                beneficiario: selectBenef.value === 'otro' ?
                    inputPersonalizado.value.trim() :
                    selectBenef.value,
                id_beneficiario: registrosFiltrados[0].user,
                pagado_por: contenido.querySelector('input[name="pagado_por"]').value.trim(),
                justificativos_id: contenido.querySelector('input[name="justificativos"]').value,
                justificativosDetallados, // Usando los valores de la tabla
                subtotal: parseFloat(contenido.querySelector('input[name="subtotal"]').value),
                descuento: parseFloat(contenido.querySelector('input[name="descuento"]').value) || 0,
                aumento: parseFloat(contenido.querySelector('input[name="aumento"]').value) || 0,
                total: parseFloat(contenido.querySelector('input[name="total"]').value),
                observaciones: contenido.querySelector('input[name="observaciones"]').value.trim(),
                registros: registrosFiltrados.map(r => r.id),
                tipo: 'produccion'
            };

            // Validaciones
            if (!formData.nombre_pago || !formData.beneficiario) {
                mostrarNotificacion({
                    message: 'Por favor complete los campos obligatorios',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                const signal = await mostrarProgreso('.pro-pago')
                const response = await fetch('/registrar-pago', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    cerrarAnuncioManual('anuncioSecond');
                    mostrarNotificacion({
                        message: 'Pago registrado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                    registrarNotificacion(
                        'Administración',
                        'Información',
                        usuarioInfo.nombre + ' registro un nuevo pago pendiente de producción')
                } else {
                    throw new Error(data.error || 'Error al registrar el pago');
                }
            } catch (error) {
                if (error.message === 'cancelled') {
                    console.log('Operación cancelada por el usuario');
                    return;
                }
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al registrar el pago',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarProgreso('.pro-pago')
            }
        }
    }
    aplicarFiltros();
}