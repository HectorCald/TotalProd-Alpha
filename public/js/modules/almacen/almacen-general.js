import { usuarioInfo } from "../../dashboard.js";
export let productos = [];
let productosAcopio = [];
let etiquetas = [];
let precios = [];
let clientes = [];
let proveedores = [];
let nombresUsuariosGlobal = [];
let tipoEvento = [];
let modoTiraGlobal = true;

let carritoSalidas = new Map(JSON.parse(localStorage.getItem('damabrava_carrito') || '[]'));
let carritoIngresos = new Map(JSON.parse(localStorage.getItem('damabrava_carrito_ingresos') || '[]'));


const DB_NAME = 'damabrava_db';
const PRODUCTO_ALM_DB = 'prductos_alm';
const PRODUCTOS_AC_DB = 'productos_acopio';
const PRECIOS_ALM_DB = 'precios_alm';
const ETIQUETAS_ALM_DB = 'etiquetas_almacen';
const CLIENTES_DB = 'clientes';
const PROVEEDOR_DB = 'proveedores';
const NOMBRES_USUARIOS_DB = 'nombres_usuarios';


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
        console.error('Error al obtener proveedores:', error);
        return false;
    }
}
async function obtenerClientes() {
    try {
        const clientesCache = await obtenerLocal(CLIENTES_DB, DB_NAME);

        if (clientesCache.length > 0) {
            clientes = clientesCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
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
async function obtenerEtiquetas() {
    try {

        const etiquetasAlmacenCache = await obtenerLocal(ETIQUETAS_ALM_DB, DB_NAME);

        if (etiquetasAlmacenCache.length > 0) {
            etiquetas = etiquetasAlmacenCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-etiquetas');
        const data = await response.json();
        if (data.success) {
            etiquetas = data.etiquetas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(etiquetasAlmacenCache) !== JSON.stringify(etiquetas)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(ETIQUETAS_ALM_DB, DB_NAME);
                        const tx = db.transaction(ETIQUETAS_ALM_DB, 'readwrite');
                        const store = tx.objectStore(ETIQUETAS_ALM_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of etiquetas) {
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
        console.error('Error al obtener etiquetas:', error);
        return false;
    }
}
async function obtenerPrecios() {
    try {

        const preciosAlmCachce = await obtenerLocal(PRECIOS_ALM_DB, DB_NAME);

        if (preciosAlmCachce.length > 0) {
            precios = preciosAlmCachce.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actulizando desde el cache')
        }
        try {
            const response = await fetch('/obtener-precios');
            const data = await response.json();

            if (data.success) {
                precios = data.precios.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });
                if (JSON.stringify(preciosAlmCachce) !== JSON.stringify(precios)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    updateHTMLWithData();
                    (async () => {
                        try {
                            const db = await initDB(PRECIOS_ALM_DB, DB_NAME);
                            const tx = db.transaction(PRECIOS_ALM_DB, 'readwrite');
                            const store = tx.objectStore(PRECIOS_ALM_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of precios) {
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
        return false;
    } finally {

    }
}
async function obtenerAlmacenAcopio() {
    try {

        const productosAcopioCache = await obtenerLocal(PRODUCTOS_AC_DB, DB_NAME);

        if (productosAcopioCache.length > 0) {
            productosAcopio = productosAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actualizando desde el cache productos')
        }
        const response = await fetch('/obtener-productos-acopio');
        const data = await response.json();

        if (data.success) {
            productosAcopio = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(productosAcopioCache) !== JSON.stringify(productosAcopio)) {
                console.log('Diferencias encontradas, actualizando UI');

                (async () => {
                    try {
                        const db = await initDB(PRODUCTOS_AC_DB, DB_NAME);
                        const tx = db.transaction(PRODUCTOS_AC_DB, 'readwrite');
                        const store = tx.objectStore(PRODUCTOS_AC_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of productosAcopio) {
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
        console.error('Error al obtener los pagos:', error);
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
            updateHTMLWithData();
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


export async function mostrarAlmacenGeneral() {
    tipoEvento = localStorage.getItem('tipoEventoAlmacenLocal') || 'almacen';
    renderInitialHTML();

    const [etiquetas, precios, clientes, proveedores, nombres, acopio, almacen, eventos] = await Promise.all([
        obtenerEtiquetas(),
        obtenerPrecios(),
        obtenerClientes(),
        obtenerProveedores(),
        obtenerNombresUsuarios(),
        obtenerAlmacenAcopio(),
        await obtenerAlmacenGeneral(),
    ]);

}
function renderInitialHTML() {

    const view = document.querySelector('.almacen-general-cont');

    const initialHTML = `  
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Almacen general</p>
                </div>
                 
                <div class="botones-container">
                    ${tienePermiso('creacion') && tipoEvento === 'almacen' ? `
                    <button class="btn-crear-producto btn trans"> <i class='bx bx-plus'></i></button>
                    <button class="btn-etiquetas btn blue"><i class='bx bx-purchase-tag'></i></button>
                    <button class="btn-precios btn orange"><i class='bx bx-dollar'></i></button>
                    ` : ''}
                    ${tipoEvento === 'conteo' ? `<button class="vista-previa btn orange"><i class='bx bx-show'></i></button>` : ''}
                    ${tipoEvento === 'salidas' ? `<button class="btn-flotante-salidas btn blue" style="position:relative" onlclick="mostrarCarritoSalidas()"><i class="bx bx-cart"></i></button>` : ''}
                    ${tipoEvento === 'ingresos' ? `<button class="btn-flotante-ingresos btn blue" style="position:relative" onlclick="mostrarCarritoSalidas()"><i class="bx bx-cart"></i></button>` : ''}
                </div>
            </div>
            <div class="buscador-view">
                <button class="lupa"><i class='bx bx-search'></i></button>
                <input type="text" class="search" placeholder="Buscar...">
                <button class="limpiar-search"><i class='bx bx-x'></i></button>
            </div>
            <div class="filtros-view etiquetas-filter">
                <button class="btn-filtro todos activo">Todos</button>
                ${Array(5).fill().map(() => `
                    <div class="skeleton skeleton-etiqueta"></div>
                `).join('')}
            </div>
            <div class="filtros-view cantidad-filter">
                <button class="btn-filtro"><i class='bx bx-sort-down'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-up'></i></button>
                <button class="btn-filtro activo"><i class='bx bx-sort-a-z'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-z-a'></i></button>
                <button class="btn-filtro sueltas">Sueltas</button>
                <select class="precios-select select" style="width:auto">
                    <option value="">Precios</option>
                </select>
                <select name="tipoEventos" id="eventoTipo" class="tipo">
                    <option value="almacen">Almacen</option>
                    <option value="conteo">Conteo</option>
                    <option value="salidas">Salida</option>
                    <option value="ingresos">Ingreso</option>
                </select>
                ${tipoEvento === 'salidas' || tipoEvento === 'ingresos' ? `
                    <div class="input switch-container">
                        <label class="switch">
                            <input type="checkbox" class="botones-cancelacion switch-tira-global">
                            <span class="slider round slider-thumb"></span>
                        </label>
                    </div>
                `: ''}
                
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
async function updateHTMLWithData() {
    const etiquetasFilter = document.querySelector('.etiquetas-filter');
    const skeletons = etiquetasFilter.querySelectorAll('.skeleton');
    skeletons.forEach(s => s.remove());

    // ✅ AGREGAR ESTA LÍNEA - Eliminar etiquetas existentes
    const etiquetasExistentes = etiquetasFilter.querySelectorAll('.btn-filtro:not(.todos)');
    etiquetasExistentes.forEach(e => e.remove());

    const etiquetasHTML = etiquetas.map(etiqueta => `
    <button class="btn-filtro">${etiqueta.etiqueta}</button>
    `).join('');

    etiquetasFilter.insertAdjacentHTML('beforeend', etiquetasHTML);

    const preciosSelect = document.querySelector('.precios-select');
    const preciosOpciones = precios.map((precio, index) => {
        const primerPrecio = precio.precio.split(';')[0].split(',')[0];
        return `<option value="${precio.id}" ${index === 1 ? 'selected' : ''}>${primerPrecio}</option>`;
    }).join('');
    preciosSelect.innerHTML = preciosOpciones;

    const productosContainer = document.querySelector('.almacen-general-cont .contenido-view');
    // --- Detectar o forzar modo tira global activo por defecto ---
    const switchTiraGlobal = document.querySelector('.switch-tira-global');
    if (switchTiraGlobal) {
        switchTiraGlobal.checked = modoTiraGlobal;
    }
    const productosHTML = productos.map(producto => {
        let imagenMostrar = '<i class=\'bx bx-package\'></i>';
        // Formatear precio a dos decimales
        let precioMostrar = '';
        if (producto.precios) {
            const primerPrecio = producto.precios.split(';')[0];
            const partes = primerPrecio.split(',');
            let precioUnitario = 0;
            if (partes.length > 1) {
                precioUnitario = !isNaN(parseFloat(partes[1])) ? parseFloat(partes[1]) : 0;
            }
            let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
            let precioTira = precioUnitario * cantidadxgrupo;
            precioMostrar = precioTira.toFixed(2);
        } else {
            precioMostrar = '0.00';
        }
        const itemCarrito = tipoEvento === 'salidas' ? carritoSalidas.get(producto.id) : carritoIngresos.get(producto.id);
        let cantidadEnCarrito = itemCarrito ? itemCarrito.cantidad : 0;
        let stockDisponible = producto.stock;
        if (itemCarrito) {
            if (modoTiraGlobal && producto.cantidadxgrupo) {
                stockDisponible = producto.stock - cantidadEnCarrito;
            } else if (producto.cantidadxgrupo) {
                stockDisponible = (producto.stock * producto.cantidadxgrupo) - cantidadEnCarrito;
            } else {
                stockDisponible = producto.stock - cantidadEnCarrito;
            }
        } else {
            if (modoTiraGlobal && producto.cantidadxgrupo) {
                stockDisponible = producto.stock;
            } else if (producto.cantidadxgrupo) {
                stockDisponible = producto.stock * producto.cantidadxgrupo;
            } else {
                stockDisponible = producto.stock;
            }
        }
        // Mostrar el span siempre, pero oculto si no hay nada en el carrito
        const mostrarCantidad = cantidadEnCarrito > 0 ? '' : 'style="display:none"';

        if (tipoEvento === 'conteo') {
            return `
            <div class="item-view" data-id="${producto.id}">
                <div class="header-view">
                    ${imagenMostrar}
                    <div class="info-header">
                        <span class="id-flotante"><span class="id">${producto.id}</span><span style="display:none">${producto.stock} Und.</span><input type="number" class="stock-fisico" value="${producto.stock}" min="0"></span>
                        <span class="detalle"><strong>${producto.producto} - ${producto.gramos}gr.</strong></span>
                        <span class="pie">${producto.etiquetas.split(';').join(' • ')}</span>
                    </div>
                </div>
            </div>
        `;
        } else {

            return `
            <div class="item-view" data-id="${producto.id}">
                <div class="header-view">
                    ${imagenMostrar}
                    <div class="info-header">
                        <div class="id-flotante"><span class="id">${producto.id}</span><span style="display:flex; gap:5px"><span class="flotante-view blue stock">${stockDisponible} Und.</span><span class="flotante-view orange">Bs. ${precioMostrar}</span><span class="carrito-cantidad" ${mostrarCantidad}>${cantidadEnCarrito > 0 ? cantidadEnCarrito : ''}</span></span></div>
                        <span class="detalle">${producto.producto} - ${producto.gramos}gr.</span>
                        <span class="pie">${producto.etiquetas.split(';').join(' • ')}</span>
                    </div>
                </div>
            </div>
        `;
        }

    }).join('');

    // Renderizar HTML
    productosContainer.innerHTML = productosHTML;
    if (tipoEvento === 'salidas') {
        const carritoBasico = new Map(JSON.parse(localStorage.getItem('damabrava_carrito') || '[]'));
        carritoSalidas = new Map();
        const selectPrecios = document.querySelector('.precios-select');
        const ciudadSeleccionada = selectPrecios.options[selectPrecios.selectedIndex].text;

        carritoBasico.forEach((item, id) => {
            const productoActual = productos.find(p => p.id === id);
            if (productoActual) {
                // Obtener el precio según la ciudad seleccionada
                const preciosProducto = productoActual.precios.split(';');
                const precioSeleccionado = preciosProducto.find(p => p.split(',')[0] === ciudadSeleccionada);
                const precioActual = precioSeleccionado ? parseFloat(precioSeleccionado.split(',')[1]) : 0;

                carritoSalidas.set(id, {
                    ...productoActual,
                    cantidad: item.cantidad,
                    subtotal: precioActual // Usar el precio según la ciudad seleccionada
                });

                // Actualizar UI
                const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
                if (headerItem) {
                    const stockSpan = headerItem.querySelector('.stock');
                    if (stockSpan) stockSpan.textContent = `${productoActual.stock - item.cantidad} Und.`;
                    const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                    if (cantidadSpan) cantidadSpan.textContent = item.cantidad;
                }
            }
        });

        localStorage.setItem('damabrava_carrito', JSON.stringify(Array.from(carritoSalidas.entries())));
    } else if (tipoEvento === 'ingresos') {
        const carritoBasico = new Map(JSON.parse(localStorage.getItem('damabrava_carrito_ingresos') || '[]'));
        carritoIngresos = new Map();
        const selectPrecios = document.querySelector('.precios-select');
        const ciudadSeleccionada = selectPrecios.options[selectPrecios.selectedIndex].text;

        carritoBasico.forEach((item, id) => {
            const productoActual = productos.find(p => p.id === id);
            if (productoActual) {
                // Obtener el precio según la ciudad seleccionada
                const preciosProducto = productoActual.precios.split(';');
                const precioSeleccionado = preciosProducto.find(p => p.split(',')[0] === ciudadSeleccionada);
                const precioActual = precioSeleccionado ? parseFloat(precioSeleccionado.split(',')[1]) : 0;

                carritoIngresos.set(id, {
                    ...productoActual,
                    cantidad: item.cantidad,
                    subtotal: precioActual // Usar el precio según la ciudad seleccionada
                });

                // Actualizar UI
                const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
                if (headerItem) {
                    const stockSpan = headerItem.querySelector('.stock');
                    if (stockSpan) stockSpan.textContent = `${productoActual.stock + item.cantidad} Und.`;
                    const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                    if (cantidadSpan) cantidadSpan.textContent = item.cantidad;
                }
            }
        });

        localStorage.setItem('damabrava_carrito_ingresos', JSON.stringify(Array.from(carritoIngresos.entries())));
    }
    eventosAlmacenGeneral()
}


async function eventosAlmacenGeneral() {
    const botonesEtiquetas = document.querySelectorAll('.filtros-view.etiquetas-filter .btn-filtro');
    const botonesCantidad = document.querySelectorAll('.filtros-view.cantidad-filter .btn-filtro');
    const selectPrecios = document.querySelector('.precios-select');

    const btnCrearProducto = document.querySelectorAll('.btn-crear-producto');
    const btnEtiquetas = document.querySelectorAll('.btn-etiquetas');
    const btnPrecios = document.querySelectorAll('.btn-precios');

    const items = document.querySelectorAll('.item-view');
    const inputBusqueda = document.querySelector('.search');
    const btnLimpiar = document.querySelector('.limpiar-search');

    let filtroEtiquetaAlmacen = localStorage.getItem('filtroEtiquetaAlmacen') || 'Todos';

    const select = document.getElementById('eventoTipo');
    console.log('Tipo en almacen' + tipoEvento)
    select.value = tipoEvento;
    console.log('tipoEvento', tipoEvento);
    select.addEventListener('change', () => {
        localStorage.setItem('tipoEventoAlmacenLocal', select.value);
        tipoEvento = select.value; // <-- ACTUALIZA la variable global
        renderInitialHTML();
        updateHTMLWithData();
    });
    select.addEventListener('click', (e) => {
        scrollToCenter(e.target, e.target.parentElement);
    });

    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    function aplicarFiltros() {
        const busqueda = normalizarTexto(inputBusqueda.value);
        const botonCantidadActivo = document.querySelector('.filtros-view.cantidad-filter .btn-filtro.activo');
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');
        const precioSeleccionado = selectPrecios.selectedIndex >= 0 && selectPrecios.options[selectPrecios.selectedIndex] ?
            selectPrecios.options[selectPrecios.selectedIndex].text : '';
        const botonSueltas = document.querySelector('.filtros-view.cantidad-filter .btn-filtro.sueltas');
        const mostrarSueltas = botonSueltas.classList.contains('activo');


        const itemsFiltrados = Array.from(items).map(registro => {
            const itemData = productos.find(r => r.id === registro.dataset.id);
            if (!itemData) return { elemento: registro, mostrar: false };




            let mostrar = true;

            // Filtro por tipo
            if (filtroEtiquetaAlmacen && filtroEtiquetaAlmacen !== 'Todos') {
                const etiquetas = itemData.etiquetas ? itemData.etiquetas.split(';') : [];
                mostrar = etiquetas.includes(filtroEtiquetaAlmacen);
            }

            // Filtro de sueltas
            if (mostrarSueltas) {
                mostrar = itemData.uSueltas && itemData.uSueltas > 0;
            }


            // Filtro por búsqueda (mantener existente)
            if (mostrar && busqueda) {
                const textoRegistro = [
                    itemData.id,
                    itemData.producto,
                    itemData.etiqueta,
                ].filter(Boolean).join(' ').toLowerCase();

                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        if (botonCantidadActivo) {
            const index = Array.from(botonesCantidad).indexOf(botonCantidadActivo);
            const contenedor = document.querySelector('.almacen-general-cont .contenido-view');
            // Solo hijos directos .item-view
            const itemsArray = Array.from(contenedor.children).filter(el => el.classList.contains('item-view'));

            itemsArray.sort((a, b) => {
                if (index === 0) { // Mayor a menor stock
                    const stockA = parseFloat(a.querySelector('.stock').textContent) || 0;
                    const stockB = parseFloat(b.querySelector('.stock').textContent) || 0;
                    return stockB - stockA;
                }
                if (index === 1) { // Menor a mayor stock
                    const stockA = parseFloat(a.querySelector('.stock').textContent) || 0;
                    const stockB = parseFloat(b.querySelector('.stock').textContent) || 0;
                    return stockA - stockB;
                }
                if (index === 2) { // A-Z nombre
                    const nombreA = a.querySelector('.detalle')?.textContent.trim().toLowerCase() || '';
                    const nombreB = b.querySelector('.detalle')?.textContent.trim().toLowerCase() || '';
                    return nombreA.localeCompare(nombreB);
                }
                if (index === 3) { // Z-A nombre
                    const nombreA = a.querySelector('.detalle')?.textContent.trim().toLowerCase() || '';
                    const nombreB = b.querySelector('.detalle')?.textContent.trim().toLowerCase() || '';
                    return nombreB.localeCompare(nombreA);
                }
                return 0;
            });

            // Reinsertar en el DOM en el nuevo orden
            itemsArray.forEach(item => contenedor.appendChild(item));
        }

        items.forEach(registro => {
            const itemData = productos.find(r => r.id === registro.dataset.id);
            if (!itemData) return;
            const preciosProducto = itemData.precios ? itemData.precios.split(';') : [];
            let precioMostrar = '';
            if (precioSeleccionado && precioSeleccionado !== 'Precios') {
                // Buscar el precio por ciudad/nombre
                const precioFiltrado = preciosProducto.find(p => p.split(',')[0] === precioSeleccionado);
                if (precioFiltrado) {
                    const valor = precioFiltrado.split(',')[1];
                    let precioUnitario = !isNaN(parseFloat(valor)) ? parseFloat(valor) : 0;
                    let cantidadxgrupo = itemData.cantidadxgrupo ? parseInt(itemData.cantidadxgrupo) : 1;
                    let precioTira = precioUnitario * cantidadxgrupo;
                    precioMostrar = precioTira.toFixed(2);
                }
            }
            if (!precioMostrar) {
                // Si no hay precio seleccionado o no se encontró, mostrar el primero
                const primerPrecio = preciosProducto[0] ? preciosProducto[0].split(',')[1] : '0.00';
                let precioUnitario = !isNaN(parseFloat(primerPrecio)) ? parseFloat(primerPrecio) : 0;
                let cantidadxgrupo = itemData.cantidadxgrupo ? parseInt(itemData.cantidadxgrupo) : 1;
                let precioTira = precioUnitario * cantidadxgrupo;
                precioMostrar = precioTira.toFixed(2);
            }
            // Busca el span o div donde se muestra el precio
            const precioElement = registro.querySelector('.flotante-view.orange');
            if (precioElement) {
                precioElement.textContent = `Bs. ${precioMostrar}`;
            }
        });

        const registrosVisibles = itemsFiltrados.filter(r => r.mostrar).length;
        items.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        setTimeout(() => {
            items.forEach(registro => {
                registro.style.display = 'none';
            });

            itemsFiltrados.forEach(({ elemento, mostrar }, index) => {
                if (mostrar) {
                    elemento.style.display = 'flex';
                    elemento.style.opacity = '0';
                    elemento.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        elemento.style.opacity = '1';
                        elemento.style.transform = 'translateY(0)';
                    }, 20);
                }
            });
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


    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });
    inputBusqueda.addEventListener('input', (e) => {
        toggleLimpiarBtn();
        aplicarFiltros();
    });


    botonesEtiquetas.forEach(boton => {
        boton.classList.remove('activo');
        if (boton.textContent.trim() === filtroEtiquetaAlmacen) {
            boton.classList.add('activo');
        }
        boton.addEventListener('click', () => {
            botonesEtiquetas.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
            filtroEtiquetaAlmacen = boton.textContent.trim();
            console.log(filtroEtiquetaAlmacen)
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
            localStorage.setItem('filtroEtiquetaAlmacen', filtroEtiquetaAlmacen);
        });
    });
    botonesCantidad.forEach(boton => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('sueltas')) {
                console.log('sueltas')
                boton.classList.toggle('activo');
                console.log('activando sueltas')
            } else {
                // Comportamiento normal para otros botones
                botonesCantidad.forEach(b => {
                    if (b.textContent.trim() !== 'Sueltas') {
                        b.classList.remove('activo');
                    }
                });
                boton.classList.add('activo');
            }
            scrollToCenter(boton, boton.parentElement);
            aplicarFiltros();
        });
    });
    btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.focus();
        toggleLimpiarBtn();
        aplicarFiltros();
    });


    selectPrecios.addEventListener('click', (e) => {
        scrollToCenter(e.target, e.target.parentElement);
    });
    selectPrecios.addEventListener('change', (e) => {
        scrollToCenter(e.target, e.target.parentElement);
        aplicarFiltros();
    });


    if (tipoEvento === 'almacen') {
        items.forEach(item => {
            item.addEventListener('click', function () {
                const registroId = this.dataset.id;
                window.info(registroId);
            });
        });
        window.info = async function (registroId) {
            const producto = productos.find(r => r.id === registroId);
            if (!producto) return;

            // Procesar los precios
            const preciosFormateados = producto.precios.split(';')
                .filter(precio => precio.trim()) // Eliminar elementos vacíos
                .map(precio => {
                    const [ciudad, valor] = precio.split(',');
                    return `<div class="detalle-campo"><span><i class='bx bx-store'></i> ${ciudad}: </span>Bs. ${parseFloat(valor).toFixed(2)}</div>`;
                })
                .join('');
            const etiquetasFormateados = producto.etiquetas.split(';')
                .filter(precio => precio.trim()) // Eliminar elementos vacíos
                .map(precio => {
                    const [valor] = precio.split(';');
                    return `<div class="detalle-campo"><span><i class='bx bx-tag'></i> ${valor}</span>`;
                })
                .join('');
            const contenido = document.querySelector('.screen');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Información</p>
                        </div>
                        <div class="botones-container">
                        ${tienePermiso('edicion') ? `<button class="btn-editar btn blue" data-id="${producto.id}"><i class='bx bx-edit'></i></button>` : ''}
                        ${tienePermiso('eliminacion') ? `<button class="btn-eliminar btn red" data-id="${producto.id}"><i class="bx bx-trash"></i></button>` : ''}
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información general</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${producto.id}</div>
                        <div class="detalle-campo"><span><i class="ri-scales-line"></i> Gramaje: </span>${producto.gramos}gr.</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Stock: </span>${producto.stock} Und.</div>
                        <div class="detalle-campo"><span><i class='bx bx-hash'></i> Codigo: </span>${producto.codigo_barras}</div>
                    </div>
    
                    <p class="subtitulo">Detalles adicionales</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-hash'></i> Cantidad por grupo: </span>${producto.cantidadxgrupo}</div>
                        <div class="detalle-campo"><span><i class='bx bx-list-ul'></i> Lista: </span>${producto.lista}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Almacen acopio: </span>${producto.alm_acopio_producto}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Unidades sueltas: </span>${producto.uSueltas}</div>
                    </div>
    
                    <p class="subtitulo">Precios</p>
                    <div class="campo-vertical">
                        ${preciosFormateados}
                    </div>
    
                    <p class="subtitulo">Etiquetas</p>
                    <div class="campo-vertical">
                        ${etiquetasFormateados}
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();


            if (tienePermiso('edicion')) {
                const btnEditar = contenido.querySelector('.btn-editar');
                btnEditar.addEventListener('click', () => editar(producto));
            }
            if (tienePermiso('eliminacion')) {
                const btnEliminar = contenido.querySelector('.btn-eliminar');
                btnEliminar.addEventListener('click', () => eliminar(producto));
            }
            function eliminar(producto) {
                const contenido = document.querySelector('.screen2');
                const registrationHTML = `
                    <div class="top-view">
                        <div class="encabezado">
                            <div class="titulo-back">
                                <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                                <p class="titulo">Eliminar producto</p>
                            </div>
                            <div class="botones-container">
                                <button class="btn-eliminar-producto btn red"><i class="bx bx-trash"></i> Eliminar</button>
                            </div>
                        </div>
                    </div>
                    <div class="contenido">
                        <p class="subititulo">Información general</p>
                        <div class="campo-vertical">
                            <diva class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${producto.id}</diva>
                            <diva class="detalle-campo"><span><i class='bx bx-id-card'></i> Producto: </span>${producto.producto}</diva>
                            <diva class="detalle-campo"><span><i class="ri-scales-line"></i> Gramaje: </span>${producto.gramos}gr.</diva>
                            <diva class="detalle-campo"><span><i class='bx bx-package'></i> Stock: </span>${producto.stock} Und.</diva>
                            <diva class="detalle-campo"><span><i class='bx bx-hash'></i> Codigo: </span>${producto.codigo_barras}</diva>
                        </div>
                        <p class="subititulo">Motivo de la eliminación</p>
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
                                <p>Vas a eliminar un producto del sistema. Esta acción no se puede deshacer y podría afectar a varios registros relacionados. Asegúrate de que deseas continuar.</p>
                            </div>
                        </div>
                    </div>
                `;
                contenido.innerHTML = registrationHTML;
                mostrarScreen2();

                // Agregar evento al botón guardar
                const btnEliminarProducto = contenido.querySelector('.btn-eliminar-producto');
                btnEliminarProducto.addEventListener('click', confirmarEliminacionProducto);

                async function confirmarEliminacionProducto() {
                    const motivo = document.querySelector('.motivo').value.trim();

                    if (!motivo) {
                        mostrarNotificacion('Ingresa el motivo de la eliminación')
                        return;
                    }

                    try {
                        mostrarCarga();
                        const response = await fetch(`/eliminar-producto/${registroId}`, {
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
                            await obtenerAlmacenGeneral();
                            updateHTMLWithData();
                            ocultarScreen()
                            mostrarNotificacion('Se elimino el producto', { tipo: 'exito', duracion: 2000 })
                        } else {
                            throw new Error(data.error || 'Error al eliminar el producto');
                        }
                    } catch (error) {
                        mostrarNotificacion('Error al eliminar el producto', { tipo: 'error' })
                        console.error('Error:', error);
                    } finally {
                        ocultarCarga();
                    }
                }
            }
            function editar(producto) {

                // Procesar las etiquetas actuales del producto
                const etiquetasProducto = producto.etiquetas.split(';').filter(e => e.trim());
                const etiquetasHTML = etiquetasProducto.map(etiqueta => `
                    <div class="etiqueta-item" data-valor="${etiqueta}">
                        <i class='bx bx-purchase-tag'></i>
                        <span>${etiqueta}</span>
                        <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                    </div>
                `).join('');

                const preciosFormateados = producto.precios.split(';')
                    .filter(precio => precio.trim())
                    .map(precio => {
                        const [ciudad, valor] = precio.split(',');
                        return `<div class="entrada">
                                    <i class='bx bx-store'></i>
                                    <div class="input">
                                        <p class="detalle">${ciudad}</p>
                                        <input class="precio-input" data-ciudad="${ciudad}" type="number" value="${valor}" autocomplete="off" placeholder=" " required>
                                    </div>
                                </div>`;
                    })
                    .join('');

                // Lista de etiquetas disponibles (excluyendo las ya seleccionadas)
                const etiquetasDisponibles = etiquetas
                    .map(e => e.etiqueta)
                    .filter(e => !etiquetasProducto.includes(e));

                const contenido = document.querySelector('.screen2');
                const registrationHTML = `
                    <div class="top-view">
                        <div class="encabezado">
                            <div class="titulo-back">
                                <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                                <p class="titulo">Editar producto</p>
                            </div>
                            <div class="botones-container">
                                <button class="btn-editar-producto btn blue"><i class="bx bx-save"></i> Guardar</button>
                            </div>
                        </div>
                    </div>
                    <div class="contenido">
                        <p class="subtitulo">Información basica</p>
                            <div class="entrada">
                                <i class='bx bx-cube'></i>
                                <div class="input">
                                    <p class="detalle">Producto</p>
                                    <input class="producto" type="text" value="${producto.producto}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class="ri-scales-line"></i>
                                <div class="input">
                                    <p class="detalle">Gramaje</p>
                                    <input class="gramaje" type="number" value="${producto.gramos}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-package'></i>
                                <div class="input">
                                    <p class="detalle">Stock</p>
                                    <input class="stock" type="number" value="${producto.stock}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                        </div>
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class='bx bx-barcode'></i>
                                <div class="input">
                                    <p class="detalle">Código</p>
                                    <input class="codigo-barras" type="text" value="${producto.codigo_barras}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-list-ul'></i>
                                <div class="input">
                                    <p class="detalle">Lista</p>
                                    <input class="lista" type="text" value="${producto.lista}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                        </div>
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class='bx bx-package'></i>
                                <div class="input">
                                    <p class="detalle">U. por Tira</p>
                                    <input class="cantidad-grupo" type="number" value="${producto.cantidadxgrupo}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-package'></i>
                                <div class="input">
                                    <p class="detalle">U. Sueltas</p>
                                    <input class="unidades-sueltas" type="number" value="${producto.uSueltas}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                        </div>
                            <div class="entrada">
                                <div class="input">
                                    <label class="custom-file-upload" for="imagenInput">
                                        <i class='bx bx-image'></i>
                                        Subir imagen
                                    </label>
                                    <input style="display:none"id="imagenInput" class="imagen-producto" type="file" accept="image/*">
                                </div>
                            </div>
                        <p class="subtitulo">Etiquetas</p>
                        <div class="etiquetas-container">
                            <div class="etiquetas-actuales">
                                ${etiquetasHTML}
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-purchase-tag'></i>
                            <div class="input">
                                <p class="detalle">Selecciona nueva etiqueta</p>
                                <select class="select-etiqueta" required>
                                ${etiquetasDisponibles.map(etiqueta =>
                    `<option value="${etiqueta}">${etiqueta}</option>`
                ).join('')}
                                </select>
                                <button type="button" class="btn-agregar-etiqueta"><i class='bx bx-plus'></i></button>
                            </div>
                        </div>
            
                        <p class="subtitulo">Precios</p>
                            ${preciosFormateados}
            
                        <p class="subtitulo">Almacén acopio</p>
                            <div class="entrada">
                                <i class='bx bx-package'></i>
                                <div class="input">
                                    <p class="detalle">Selecciona Almacén acopio</p>
                                    <select class="alm-acopio-producto" required>
                                        <option value=""></option>
                                        ${productosAcopio.map(productoAcopio => `
                                            <option value="${productoAcopio.id}" ${productoAcopio.producto === producto.alm_acopio_producto ? 'selected' : ''}>
                                                ${productoAcopio.producto}
                                            </option>   
                                        `).join('')}
                                    </select>
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
                                    <p>Estás por editar un producto del sistema. Asegúrate de realizar los cambios correctamente, ya que podrían modificar información relacionada.</p>
                                </div>
                            </div>
                    </div>
                `;

                contenido.innerHTML = registrationHTML;
                mostrarScreen2();

                // Eventos para manejar etiquetas
                const btnAgregarEtiqueta = contenido.querySelector('.btn-agregar-etiqueta');
                const selectEtiqueta = contenido.querySelector('.select-etiqueta');
                const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');

                btnAgregarEtiqueta.addEventListener('click', () => {
                    const etiquetaSeleccionada = selectEtiqueta.value;
                    if (etiquetaSeleccionada) {
                        const nuevaEtiqueta = document.createElement('div');
                        nuevaEtiqueta.className = 'etiqueta-item';
                        nuevaEtiqueta.dataset.valor = etiquetaSeleccionada;
                        nuevaEtiqueta.innerHTML = `
                        <i class='bx bx-purchase-tag'></i>
                        <span>${etiquetaSeleccionada}</span>
                        <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                    `;
                        etiquetasActuales.appendChild(nuevaEtiqueta);
                        selectEtiqueta.querySelector(`option[value="${etiquetaSeleccionada}"]`).remove();
                        selectEtiqueta.value = '';
                    }
                });

                // Eventos para quitar etiquetas
                etiquetasActuales.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-quitar-etiqueta')) {
                        const etiquetaItem = e.target.closest('.etiqueta-item');
                        const valorEtiqueta = etiquetaItem.dataset.valor;
                        const option = document.createElement('option');
                        option.value = valorEtiqueta;
                        option.textContent = valorEtiqueta;
                        selectEtiqueta.appendChild(option);
                        etiquetaItem.remove();
                    }
                });

                // Agregar evento al botón guardar
                const btnEditarProducto = contenido.querySelector('.btn-editar-producto');
                btnEditarProducto.addEventListener('click', confirmarEdicionProducto);

                async function confirmarEdicionProducto() {
                    try {
                        // Crear FormData para enviar la imagen y los datos
                        const formData = new FormData();

                        // Obtener todos los campos del formulario
                        const producto = document.querySelector('.producto').value.trim();
                        const gramos = document.querySelector('.gramaje').value.trim();
                        const stock = document.querySelector('.stock').value.trim();
                        const cantidadxgrupo = document.querySelector('.cantidad-grupo').value.trim();
                        const lista = document.querySelector('.lista').value.trim();
                        const codigo_barras = document.querySelector('.codigo-barras').value.trim();
                        const uSueltas = document.querySelector('.unidades-sueltas').value.trim();
                        const motivo = document.querySelector('.motivo').value.trim();
                        const alm_acopio_id = document.querySelector('.alm-acopio-producto').value;
                        const alm_acopio_producto = alm_acopio_id ?
                            productosAcopio.find(p => p.id === alm_acopio_id)?.producto :
                            '';

                        // Validar motivo
                        if (!motivo) {
                            mostrarNotificacion('Ingresa el motivo de la edición')
                            return;
                        }

                        // Obtener etiquetas seleccionadas
                        const etiquetasSeleccionadas = Array.from(document.querySelectorAll('.etiquetas-actuales .etiqueta-item'))
                            .map(item => item.dataset.valor)
                            .join(';');

                        // Obtener precios
                        const preciosInputs = document.querySelectorAll('.editar-producto .precio-input');
                        const preciosActualizados = Array.from(preciosInputs)
                            .map(input => `${input.dataset.ciudad},${input.value}`)
                            .join(';');

                        // Agregar todos los campos al FormData
                        formData.append('producto', producto);
                        formData.append('gramos', gramos);
                        formData.append('stock', stock);
                        formData.append('cantidadxgrupo', cantidadxgrupo);
                        formData.append('lista', lista);
                        formData.append('codigo_barras', codigo_barras);
                        formData.append('etiquetas', etiquetasSeleccionadas);
                        formData.append('precios', preciosActualizados);
                        formData.append('uSueltas', uSueltas);
                        formData.append('alm_acopio_id', alm_acopio_id);
                        formData.append('alm_acopio_producto', alm_acopio_producto);
                        formData.append('motivo', motivo);

                        // Procesar imagen si existe
                        const imagenInput = document.querySelector('.editar-producto .imagen-producto');
                        if (imagenInput.files && imagenInput.files[0]) {
                            formData.append('imagen', imagenInput.files[0]);
                        }

                        mostrarCarga();

                        const response = await fetch(`/actualizar-producto/${registroId}`, {
                            method: 'PUT',
                            body: formData // Ya no necesitamos headers porque FormData los establece automáticamente
                        });

                        if (!response.ok) {
                            throw new Error('Error en la respuesta del servidor');
                        }

                        const data = await response.json();

                        if (data.success) {
                            await obtenerAlmacenGeneral();
                            info(registroId)
                            updateHTMLWithData();
                            mostrarNotificacion('Se actualizo el producto', { tipo: 'exito', duracion: 2000 })
                        } else {
                            throw new Error(data.error || 'Error al actualizar el producto');
                        }
                    } catch (error) {
                        mostrarNotificacion('Error al actualizar', { tipo: 'error' })
                        console.error('Error:', error);
                    } finally {
                        ocultarCarga();
                    }
                }
            }
        }
        if (tienePermiso('creacion')) {
            btnCrearProducto.forEach(btn => {
                btn.addEventListener('click', crearProducto);
            });
            btnEtiquetas.forEach(btn => {
                btn.addEventListener('click', gestionarEtiquetas);
            });
            btnPrecios.forEach(btn => {
                btn.addEventListener('click', gestionarPrecios);
            });
        }
        function crearProducto() {

            const preciosFormateados = precios.map(precio => {
                return `<div class="entrada">
                            <i class='bx bx-store'></i>
                            <div class="input">
                                <p class="detalle">${precio.precio}</p>
                                <input class="precio-input" data-ciudad="${precio.precio}" type="number" value="" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>`;
            }).join('');

            // Lista de todas las etiquetas disponibles
            const etiquetasDisponibles = etiquetas.map(e => e.etiqueta);

            const contenido = document.querySelector('.screen');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Nuevo producto</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-crear-producto btn orange"><i class="bx bx-plus"></i> Añadir</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información basica</p>
                        <div class="entrada">
                            <i class='bx bx-cube'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input class="producto" type="text"  autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class="ri-scales-line"></i>
                            <div class="input">
                                <p class="detalle">Gramaje</p>
                                <input class="gramaje" type="number"  autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
    
                    <p class="subtitulo">Detalles del producto</p>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Stock</p>
                                <input class="stock" type="number"  autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-barcode'></i>
                            <div class="input">
                                <p class="detalle">Código</p>
                                <input class="codigo-barras" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-list-ul'></i>
                            <div class="input">
                                <p class="detalle">Lista</p>
                                <input class="lista" type="text" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">U. por Tira</p>
                                <input class="cantidad-grupo" type="number"  autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                        
                        
                    <p class="subtitulo">Etiquetas</p>
                    <div class="etiquetas-container">
                        <div class="etiquetas-actuales">
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-purchase-tag'></i>
                        <div class="input">
                            <p class="detalle">Selecciona nueva etiqueta</p>
                            <select class="select-etiqueta" required>
                                <option value=""></option>
                                            ${etiquetasDisponibles.map(etiqueta =>
                `<option value="${etiqueta}">${etiqueta}</option>`
            ).join('')}
                            </select>
                            <button type="button" class="btn-agregar-etiqueta"><i class='bx bx-plus'></i></button>
                        </div>
                    </div>
    
                    <p class="subtitulo">Precios</p>
                        ${preciosFormateados}
    
                    <p class="normal">Almacen acopio</p>
                    <div class="entrada">
                        <i class='bx bx-package'></i>
                        <div class="input">
                            <p class="detalle">Selecciona Almacén acopio</p>
                            <select class="alm-acopio-producto" required>
                                <option value=""></option>
                                ${productosAcopio.map(producto => `
                                    <option value="${producto.id}">${producto.producto}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            // Eventos para manejar etiquetas
            const btnAgregarEtiqueta = contenido.querySelector('.btn-agregar-etiqueta');
            const selectEtiqueta = contenido.querySelector('.select-etiqueta');
            const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');

            btnAgregarEtiqueta.addEventListener('click', () => {
                const etiquetaSeleccionada = selectEtiqueta.value;
                if (etiquetaSeleccionada) {
                    const nuevaEtiqueta = document.createElement('div');
                    nuevaEtiqueta.className = 'etiqueta-item';
                    nuevaEtiqueta.dataset.valor = etiquetaSeleccionada;
                    nuevaEtiqueta.innerHTML = `
                    <i class='bx bx-purchase-tag'></i>
                    <span>${etiquetaSeleccionada}</span>
                    <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                `;
                    etiquetasActuales.appendChild(nuevaEtiqueta);
                    selectEtiqueta.querySelector(`option[value="${etiquetaSeleccionada}"]`).remove();
                    selectEtiqueta.value = '';
                }
            });

            // Eventos para quitar etiquetas
            etiquetasActuales.addEventListener('click', (e) => {
                if (e.target.closest('.btn-quitar-etiqueta')) {
                    const etiquetaItem = e.target.closest('.etiqueta-item');
                    const valorEtiqueta = etiquetaItem.dataset.valor;
                    const option = document.createElement('option');
                    option.value = valorEtiqueta;
                    option.textContent = valorEtiqueta;
                    selectEtiqueta.appendChild(option);
                    etiquetaItem.remove();
                }
            });

            // Agregar evento al botón guardar
            const btnCrear = contenido.querySelector('.btn-crear-producto');
            btnCrear.addEventListener('click', confirmarCreacion);

            async function confirmarCreacion() {
                const producto = document.querySelector('.producto').value.trim();
                const gramos = document.querySelector('.gramaje').value.trim();
                const stock = document.querySelector('.stock').value.trim();
                const cantidadxgrupo = document.querySelector('.cantidad-grupo').value.trim();
                const lista = document.querySelector('.lista').value.trim();
                const codigo_barras = document.querySelector('.codigo-barras').value.trim();
                const acopioSelect = document.querySelector('.alm-acopio-producto');

                // Obtener precios formateados (ciudad,valor;ciudad,valor)
                const preciosSeleccionados = Array.from(document.querySelectorAll('.nuevo-producto .precio-input'))
                    .map(input => `${input.dataset.ciudad},${input.value || '0'}`)
                    .join(';');

                // Obtener etiquetas del contenedor (etiqueta;etiqueta)
                const etiquetasSeleccionadas = Array.from(document.querySelectorAll('.nuevo-producto .etiquetas-actuales .etiqueta-item'))
                    .map(item => item.dataset.valor)
                    .join(';');

                // Obtener info del producto de acopio
                const acopio_id = acopioSelect.value;
                const alm_acopio_producto = acopio_id ?
                    productosAcopio.find(p => p.id === acopio_id)?.producto :
                    'No hay índice seleccionado';

                if (!producto || !gramos || !stock || !cantidadxgrupo || !lista) {
                    mostrarNotificacion('Ingresa todos los campos obligatorios')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch('/crear-producto', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            producto,
                            gramos,
                            stock,
                            cantidadxgrupo,
                            lista,
                            codigo_barras,
                            precios: preciosSeleccionados,
                            etiquetas: etiquetasSeleccionadas,
                            acopio_id,
                            alm_acopio_producto
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerAlmacenGeneral();
                        updateHTMLWithData();
                        info(data.id)
                        mostrarNotificacion('Se creo un nuevo producto', { tipo: 'exito', duracion: 2000 })
                    } else {
                        throw new Error(data.error || 'Error al crear el producto');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al crear nuevo producto', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }
        function gestionarEtiquetas() {
            const contenido = document.querySelector('.screen');
            const etiquetasHTML = etiquetas.map(etiqueta => `
                    <div class="etiqueta-item" data-id="${etiqueta.id}">
                        <i class='bx bx-purchase-tag'></i>
                        <span>${etiqueta.etiqueta}</span>
                        <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                    </div>
                `).join('');

            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Etiquetas</p>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Etiquetas existentes</p>
                    <div class="etiquetas-container">
                        <div class="etiquetas-actuales">
                            ${etiquetasHTML}
                        </div>
                    </div>
    
                    <p class="subtitulo">Agregar nueva etiqueta</p>
                    <div class="entrada">
                        <i class='bx bx-purchase-tag'></i>
                        <div class="input">
                            <p class="detalle">Nueva etiqueta</p>
                            <input class="nueva-etiqueta" type="text" autocomplete="off" placeholder=" " required>
                            <button type="button" class="btn-agregar-etiqueta-temp"><i class='bx bx-plus'></i></button>
                        </div>
                    </div>
                </div>
                `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();


            const btnAgregarTemp = contenido.querySelector('.btn-agregar-etiqueta-temp');
            const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');


            btnAgregarTemp.addEventListener('click', async () => {
                const nuevaEtiqueta = document.querySelector('.nueva-etiqueta').value.trim();
                if (nuevaEtiqueta) {
                    try {
                        mostrarCarga();
                        const response = await fetch('/agregar-etiqueta', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ etiqueta: nuevaEtiqueta })
                        });

                        if (!response.ok) throw new Error('Error al agregar etiqueta');

                        const data = await response.json();
                        if (data.success) {
                            await obtenerEtiquetas();
                            updateHTMLWithData();
                            gestionarEtiquetas();
                            document.querySelector('.nueva-etiqueta').value = '';
                            mostrarNotificacion('Se agrego la etiqueta', { tipo: 'exito', duracion: 2000 })
                        }
                    } catch (error) {
                        mostrarNotificacion('Error al agregar la etiqueta', { tipo: 'error' })
                    } finally {
                        ocultarCarga();
                    }
                }
            });
            etiquetasActuales.addEventListener('click', async (e) => {
                if (e.target.closest('.btn-quitar-etiqueta')) {
                    try {
                        mostrarCarga();
                        const etiquetaItem = e.target.closest('.etiqueta-item');
                        const etiquetaId = etiquetaItem.dataset.id;
                        // Obtener el nombre de la etiqueta eliminada
                        const etiquetaEliminada = etiquetaItem.querySelector('span').textContent.trim();

                        const response = await fetch(`/eliminar-etiqueta/${etiquetaId}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) throw new Error('Error al eliminar etiqueta');

                        const data = await response.json();
                        if (data.success) {
                            // Eliminar la etiqueta de todos los productos que la contengan
                            let productosModificados = 0;
                            for (const producto of productos) {
                                if (producto.etiquetas && producto.etiquetas.includes(etiquetaEliminada)) {
                                    // Quitar la etiqueta del string
                                    const nuevasEtiquetas = producto.etiquetas
                                        .split(';')
                                        .map(e => e.trim())
                                        .filter(e => e && e !== etiquetaEliminada)
                                        .join(';');
                                    if (nuevasEtiquetas !== producto.etiquetas) {
                                        productosModificados++;
                                        // Enviar todos los campos relevantes del producto para evitar borrar otros datos
                                        const body = {
                                            producto: producto.producto,
                                            gramos: producto.gramos,
                                            stock: producto.stock,
                                            cantidadxgrupo: producto.cantidadxgrupo,
                                            lista: producto.lista,
                                            codigo_barras: producto.codigo_barras,
                                            etiquetas: nuevasEtiquetas,
                                            precios: producto.precios,
                                            uSueltas: producto.uSueltas,
                                            alm_acopio_id: producto.acopio_id || producto.alm_acopio_id || '',
                                            alm_acopio_producto: producto.alm_acopio_producto || '',
                                            motivo: 'Eliminación de etiqueta global'
                                        };
                                        await fetch(`/actualizar-producto/${producto.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(body)
                                        });
                                    }
                                }
                            }
                            await obtenerEtiquetas();
                            await obtenerAlmacenGeneral();
                            updateHTMLWithData();
                            gestionarEtiquetas();
                            mostrarNotificacion('Se elimino la etiqueta', { tipo: 'exito', duracion: 2000 })
                        }
                    } catch (error) {
                        mostrarNotificacion('Error al eliminar la etiqueta', { tipo: 'error' })
                    } finally {
                        ocultarCarga();
                    }
                }
            });
        }
        function gestionarPrecios() {
            const preciosActuales = precios.map(precio => `
            <div class="precio-item" data-id="${precio.id}">
                <i class='bx bx-dollar'></i>
                <span>${precio.precio}</span>
                <button class="btn-eliminar-precio"><i class='bx bx-x'></i></button>
            </div>
        `).join('');

            const contenido = document.querySelector('.screen');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Precios</p>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Precios actuales</p>
                    <div class="precios-container">
                        <div class="precios-actuales">
                        ${preciosActuales}
                        </div>
                    </div>
    
                    <p class="subtitulo">Agregar nuevo precio</p>
                    <div class="entrada">
                        <i class='bx bx-dollar'></i>
                        <div class="input">
                            <p class="detalle">Nuevo precio</p>
                            <input class="nuevo-precio" type="text" autocomplete="off" placeholder=" " required>
                            <button class="btn-agregar-precio"><i class='bx bx-plus'></i></button>
                        </div>
                    </div>
                    <p class="subtitulo">Actualización de precios</p>
                    <div class="campo-horizontal">
                        <buttom class="btn blue" id="excel-precios"><i class='bx bx-upload'></i>Subir excel</buttom>
                        <buttom class="btn blue" id="hoja-vinculada"><i class='bx bx-refresh'></i>Vincular hoja</buttom>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            // Event listeners
            const btnAgregarPrecio = contenido.querySelector('.btn-agregar-precio');
            btnAgregarPrecio.addEventListener('click', async () => {
                const nuevoPrecioInput = document.querySelector('.nuevo-precio');
                const nuevoPrecio = nuevoPrecioInput.value.trim();

                if (!nuevoPrecio) {
                    mostrarNotificacion('Ingresa el precio')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch('/agregar-precio', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ precio: nuevoPrecio })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerPrecios();
                        updateHTMLWithData();
                        gestionarPrecios();
                        nuevoPrecioInput.value = '';
                        mostrarNotificacion('Se agrego el precio', { tipo: 'exito', duracion: 2000 })
                    } else {
                        throw new Error(data.error || 'Error al agregar el precio');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al agregar el precio', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
            contenido.addEventListener('click', async (e) => {
                if (e.target.closest('.btn-eliminar-precio')) {
                    const precioItem = e.target.closest('.precio-item');
                    const precioId = precioItem.dataset.id;

                    try {
                        mostrarCarga();
                        const response = await fetch(`/eliminar-precio/${precioId}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) {
                            throw new Error('Error al eliminar el precio');
                        }

                        const data = await response.json();

                        if (data.success) {
                            await obtenerPrecios();
                            updateHTMLWithData();
                            gestionarPrecios();
                            precioItem.remove();
                            mostrarNotificacion('Se elimino el precio', { tipo: 'exito', duracion: 2000 })
                        } else {
                            throw new Error(data.error || 'Error al eliminar el precio');
                        }
                    } catch (error) {
                        mostrarNotificacion('Error al eliminar el precio', { tipo: 'error' })
                        console.error('Error:', error);
                    } finally {
                        ocultarCarga();
                    }
                }
            });


            const inputExcel = contenido.querySelector('#excel-precios');
            let file = null;
            inputExcel.addEventListener('click', () => {
                // Crear un nuevo input temporal
                const tempInput = document.createElement('input');
                tempInput.type = 'file';
                tempInput.accept = '.xlsx,.xls';

                // Cuando se seleccione un archivo
                tempInput.addEventListener('change', (e) => {
                    file = e.target.files[0];
                    actualizarPlanilla(file.name);
                });

                // Simular click en el input temporal
                tempInput.click();
            });
            async function actualizarPlanilla(fileName = '') {
                const contenido = document.querySelector('.screen2');
                const registrationHTML = `
                    <div class="top-view">
                        <div class="encabezado">
                            <div class="titulo-back">
                                <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                                <p class="titulo">Planilla precios</p>
                            </div>
                            <div class="botones-container">
                                <button class="btn-procesar-planilla btn blue"><i class="bx bx-check"></i> Procesar</button>
                            </div>
                        </div>
                    </div>
                    <div class="contenido">
                        <p class="subtitulo">Archivo seleccionado</p>
                        <div class="archivo-info">
                            <i class='bx bx-file'></i>
                            <span style="color: gray; font-size: 12px">${fileName}</span>
                        </div>
    
                        <p class="subtitulo">Motivo de la actualización</p>
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
                                <p>Esta acción actualizará los precios de los productos según la planilla. Asegúrese de que el formato sea correcto.</p>
                            </div>
                        </div>
                    </div>
                `;

                contenido.innerHTML = registrationHTML;
                mostrarScreen2();

                // Modifica la parte del frontend donde registras la notificación
                const btnProcesar = contenido.querySelector('.btn-procesar-planilla');
                btnProcesar.addEventListener('click', async () => {
                    const motivo = contenido.querySelector('.motivo').value.trim();
                    if (!motivo) {
                        mostrarNotificacion('Ingresa el motivo de la actualización')
                        return;
                    }

                    try {
                        mostrarCarga();
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('motivo', motivo);

                        const response = await fetch('/actualizar-precios-planilla', {
                            method: 'POST',
                            body: formData
                        });

                        const data = await response.json();

                        if (data.success) {
                            mostrarNotificacion('Se elimino la tarea', { tipo: 'exito', duracion: 2000 })
                            await obtenerPrecios();
                            updateHTMLWithData();
                            gestionarPrecios();
                        } else {
                            throw new Error(data.error || 'Error al procesar la planilla');
                        }
                    } catch (error) {
                        mostrarNotificacion('Error al eliminar actualizar precios', { tipo: 'error' })
                        console.log(error)
                    } finally {
                        ocultarCarga();
                    }
                });

            };


            const btnHojaVinculada = contenido.querySelector('#hoja-vinculada');
            btnHojaVinculada.addEventListener('click', async () => {
                const contenido = document.querySelector('.screen2');
                const registrationHTML = `
                    <div class="top-view">
                        <div class="encabezado">
                            <div class="titulo-back">
                                <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                                <p class="titulo">Hoja vinculada</p>
                            </div>
                            <div class="botones-container">
                                <button class="btn-procesar-hoja btn blue"><i class="bx bx-check"></i> Procesar</button>
                            </div>
                        </div>
                    </div>
                    <div class="contenido">
                        <p class="subtitulo">Motivo de la actualización</p>
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
                                <p>Esta acción actualizará los precios de los productos según la hoja vinculada de Google Sheets (CATALOGO). Asegúrese de que el formato sea correcto (ID,Producto,Precios...etc).</p>
                            </div>
                        </div>
                    </div>
                `;
                contenido.innerHTML = registrationHTML;
                mostrarScreen2();

                const btnProcesar = contenido.querySelector('.btn-procesar-hoja');
                btnProcesar.addEventListener('click', async () => {
                    const motivo = contenidoTercer.querySelector('.motivo').value.trim();
                    if (!motivo) {
                        mostrarNotificacion('Ingresa el motivo de la actualización')
                        return;
                    }
                    try {
                        mostrarCarga();
                        const response = await fetch('/actualizar-precios-hoja-vinculada', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ motivo })
                        });
                        const data = await response.json();
                        if (data.success) {
                            await obtenerPrecios();
                            updateHTMLWithData();
                            gestionarPrecios();
                            mostrarNotificacion('Se actualizo los precios', { tipo: 'exito', duracion: 2000 })
                        } else {
                            throw new Error(data.error || 'Error al procesar la hoja vinculada');
                        }
                    } catch (error) {
                        mostrarNotificacion('Error al eliminar la tarea', { tipo: 'error' })
                        console.log(error)
                    } finally {
                        ocultarCarga();
                    }
                });
            });

        }
    } else if (tipoEvento === 'conteo') {
        const vistaPrevia = document.querySelectorAll('.vista-previa');
        document.querySelectorAll('.stock-fisico').forEach(input => {
            input.addEventListener('change', (e) => {
                const productoId = e.target.closest('.item-view').dataset.id;
                const nuevoValor = parseInt(e.target.value);

                // Obtener datos existentes o crear nuevo objeto
                let stockFisico = JSON.parse(localStorage.getItem('damabrava_stock_fisico') || '{}');

                // Actualizar valor
                stockFisico[productoId] = nuevoValor;

                // Guardar en localStorage
                localStorage.setItem('damabrava_stock_fisico', JSON.stringify(stockFisico));
            });
        });
        const stockGuardado = JSON.parse(localStorage.getItem('damabrava_stock_fisico') || '{}');
        Object.entries(stockGuardado).forEach(([id, valor]) => {
            const input = document.querySelector(`.item-view[data-id="${id}"] .stock-fisico`);
            if (input) {
                input.value = valor;
            }
        });
        vistaPrevia.forEach(btn => {
            btn.addEventListener('click', vistaPreviaConteo);
        })

        function vistaPreviaConteo() {
            const stockFisico = JSON.parse(localStorage.getItem('damabrava_stock_fisico') || '{}');
            const contenido = document.querySelector('.screen');

            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Vista previa</p>
                        </div>
                        <div class="botones-container">
                            <button id="registrar-conteo" class="btn trans" ><i class='bx bx-save'></i>Registrar</button>
                            <button id="restaurar-conteo" class="btn orange"><i class='bx bx-reset'></i></button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Resumen del conteo</p>
                    ${productos.map(producto => {
                const stockActual = parseInt(producto.stock);
                const stockContado = parseInt(stockFisico[producto.id] || producto.stock);
                const diferencia = stockContado - stockActual;
                const colorDiferencia = diferencia > 0 ? '#4CAF50' : diferencia < 0 ? '#f44336' : '#2196F3';

                return `
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto:</span> ${producto.producto} - ${producto.gramos}gr.</div>
                            <div style="display: flex; justify-content: space-between; margin-top: 5px; gap:5px">
                                <div class="detalle-campo"><span><i class='bx bx-box'></i> Sistema: ${stockActual}</span> </div>
                                <div class="detalle-campo"><span><i class='bx bx-calculator'></i> Fisico: ${stockContado}</span> </div>
                                <div class="detalle-campo"style="color: ${colorDiferencia}"><span><i class='bx bx-transfer'></i> Dif.: ${diferencia > 0 ? '+' : ''}${diferencia}</span></div>
                            </div>
                        </div>
                        `;
            }).join('')}
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="Observaciones" type="text" placeholder=" " required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-label'></i>  
                        <div class="input">
                            <p class="detalle">Nombre del conteo</p>
                            <input class="nombre-conteo" type="text" placeholder=" " required>
                        </div>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            // Agregar evento al botón de registrar
            // Modificar la función del botón registrar en vistaPreviaConteo
            document.getElementById('registrar-conteo').addEventListener('click', async () => {
                try {
                    mostrarCarga();
                    const stockFisico = JSON.parse(localStorage.getItem('damabrava_stock_fisico') || '{}');
                    const observaciones = document.querySelector('.Observaciones').value;
                    const nombre = document.querySelector('.nombre-conteo').value;

                    // Preparar los datos en el formato requerido
                    const idProductos = productos.map(p => p.id).join(';');
                    const productosFormateados = productos.map(p => `${p.producto} - ${p.gramos}gr`).join(';');
                    const sistemaCantidades = productos.map(p => p.stock).join(';');
                    const fisicoCantidades = productos.map(p => stockFisico[p.id] || p.stock).join(';');
                    const diferencias = productos.map(p => {
                        const fisico = parseInt(stockFisico[p.id] || p.stock);
                        const sistema = parseInt(p.stock);
                        return fisico - sistema;
                    }).join(';');

                    const response = await fetch('/registrar-conteo', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nombre: nombre || "Conteo",
                            idProductos: idProductos,
                            productos: productosFormateados,
                            sistema: sistemaCantidades,
                            fisico: fisicoCantidades,
                            diferencia: diferencias,
                            observaciones
                        })

                    });

                    const data = await response.json();

                    if (data.success) {
                        mostrarNotificacion('Se registro el conteo', { tipo: 'exito', duracion: 2000 })
                        localStorage.removeItem('damabrava_stock_fisico');
                        ocultarScreen();
                    } else {
                        throw new Error(data.error || 'Error al registrar el conteo');
                    }
                } catch (error) {
                    mostrarNotificacion('Error registrar el conteo', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
            const restaurarConteo = document.getElementById('restaurar-conteo');
            restaurarConteo.addEventListener('click', restaurarConteoAlmacen);
            function restaurarConteoAlmacen() {
                // Mostrar confirmación antes de restaurar

                // Limpiar el localStorage
                localStorage.removeItem('damabrava_stock_fisico');

                // Restaurar todos los inputs al valor original del stock
                document.querySelectorAll('.item-view').forEach(registro => {
                    const productoId = registro.dataset.id;
                    const producto = productos.find(p => p.id === productoId);
                    const input = registro.querySelector('.stock-fisico');

                    if (producto && input) {
                        input.value = producto.stock;
                    }
                });

                mostrarNotificacion('Se restauro el stock del conteo')
                ocultarScreen();
            }
        }
    } else if (tipoEvento === 'salidas') {
        const botonCarrito = document.querySelector('.btn-flotante-salidas')
        botonCarrito.addEventListener('click', mostrarCarritoSalidas);
        items.forEach(item => {
            item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
        });

        const switchTiraGlobal = document.querySelector('.switch-tira-global');
        if (switchTiraGlobal) {
            switchTiraGlobal.addEventListener('change', (e) => {
                modoTiraGlobal = e.target.checked;

                // Actualizar estilos del switch
                const slider = e.target.nextElementSibling;

                if (modoTiraGlobal) {
                    mostrarNotificacion('Se cambio a modo tira');
                } else {
                    mostrarNotificacion('Se cambio a modo unidades');
                }

                // Actualizar precios y stock en los items
                productos.forEach(producto => {
                    const item = document.querySelector(`.item-view[data-id="${producto.id}"]`);
                    if (!item) return;

                    // Calcular precio según modo
                    let precioUnitario = 0;
                    if (producto.precios) {
                        const primerPrecio = producto.precios.split(';')[0];
                        const partes = primerPrecio.split(',');
                        if (partes.length > 1) {
                            precioUnitario = !isNaN(parseFloat(partes[1])) ? parseFloat(partes[1]) : 0;
                        }
                    }
                    let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
                    let precioMostrar = modoTiraGlobal ? (precioUnitario * cantidadxgrupo).toFixed(2) : precioUnitario.toFixed(2);

                    // Calcular stock según modo
                    let cantidadEnCarrito = carritoSalidas.get(producto.id)?.cantidad || 0;
                    let stockMostrar = modoTiraGlobal ?
                        (producto.stock - cantidadEnCarrito) :
                        ((producto.stock * cantidadxgrupo) - cantidadEnCarrito);

                    // Actualizar DOM
                    const precioSpan = item.querySelector('.flotante-view.orange');
                    const stockSpan = item.querySelector('.flotante-view.blue.stock');
                    if (precioSpan) precioSpan.textContent = `Bs. ${precioMostrar}`;
                    if (stockSpan) stockSpan.textContent = `${stockMostrar} Und.`;
                });

                // Actualizar precios y stock en el carrito
                carritoSalidas.forEach((item, id) => {
                    const producto = productos.find(p => p.id === id);
                    if (!producto) return;

                    let precioUnitario = 0;
                    if (producto.precios) {
                        const primerPrecio = producto.precios.split(';')[0];
                        const partes = primerPrecio.split(',');
                        if (partes.length > 1) {
                            precioUnitario = !isNaN(parseFloat(partes[1])) ? parseFloat(partes[1]) : 0;
                        }
                    }
                    let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
                    item.subtotal = modoTiraGlobal ? precioUnitario * cantidadxgrupo : precioUnitario;
                    item.stock = modoTiraGlobal ? producto.stock : (producto.stock * cantidadxgrupo);
                });
                actualizarTotalesCarrito();
            });
        }

        window.actualizarSpan = (productoId) => {
            const producto = productos.find(p => p.id === productoId);
            const selectPrecios = document.querySelector('.precios-select');
            const ciudadSeleccionada = selectPrecios.options[selectPrecios.selectedIndex].text;
            const preciosProducto = producto.precios.split(';');
            const precioSeleccionado = preciosProducto.find(p => p.split(',')[0] === ciudadSeleccionada);
            const valor = precioSeleccionado ? precioSeleccionado.split(',')[1] : '0';
            let precioUnitario = !isNaN(parseFloat(valor)) ? parseFloat(valor) : 0;
            let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
            let precioFinal = modoTiraGlobal ? precioUnitario * cantidadxgrupo : precioUnitario;
            const item = document.querySelector(`.item-view[data-id="${productoId}"]`);
            if (item) {
                item.classList.add('agregado-al-carrito');
                setTimeout(() => {
                    item.classList.remove('agregado-al-carrito');
                }, 500);
            }

            if (carritoSalidas.has(productoId)) {
                const itemCarrito = carritoSalidas.get(productoId);
                itemCarrito.cantidad += 1;
                if (item) {
                    const cantidadSpan = item.querySelector('.carrito-cantidad');
                    if (cantidadSpan) {
                        if (itemCarrito.cantidad > 0) {
                            cantidadSpan.style.display = '';
                            cantidadSpan.textContent = itemCarrito.cantidad;
                        } else {
                            cantidadSpan.style.display = 'none';
                            cantidadSpan.textContent = '';
                        }
                    }
                }
            } else {
                carritoSalidas.set(productoId, {
                    ...producto,
                    cantidad: 1,
                    subtotal: precioFinal // calcula precioFinal según modo tira/unidades
                });
                if (item) {
                    const cantidadSpan = item.querySelector('.carrito-cantidad');
                    if (cantidadSpan) {
                        cantidadSpan.style.display = '';
                        cantidadSpan.textContent = '1';
                    }
                }
            }
        }

        // Nueva función que solo actualiza el span sin tocar el carrito
        window.actualizarSpanSolo = (productoId) => {
            const item = document.querySelector(`.item-view[data-id="${productoId}"]`);
            if (!item) return;

            const itemCarrito = carritoSalidas.get(productoId);
            if (itemCarrito) {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                if (cantidadSpan) {
                    if (itemCarrito.cantidad > 0) {
                        cantidadSpan.style.display = '';
                        cantidadSpan.textContent = itemCarrito.cantidad;
                    } else {
                        cantidadSpan.style.display = 'none';
                        cantidadSpan.textContent = '';
                    }
                }
            } else {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                if (cantidadSpan) {
                    cantidadSpan.style.display = 'none';
                    cantidadSpan.textContent = '';
                }
            }
        }
        function agregarAlCarrito(productoId) {
            const producto = productos.find(p => p.id === productoId);
            if (!producto) return;

            // Verificar stock disponible
            let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
            let stockDisponible = modoTiraGlobal ? producto.stock : (producto.stock * cantidadxgrupo);

            if (stockDisponible <= 0) {
                mostrarNotificacion('Este producto no tiene stock disponible');
                return;
            }

            // Efecto visual
            const item = document.querySelector(`.item-view[data-id="${productoId}"]`);
            if (item) {
                item.classList.add('agregado-al-carrito');
                setTimeout(() => item.classList.remove('agregado-al-carrito'), 500);
            }

            actualizarSpan(productoId);
            actualizarCarritoLocal();
            actualizarBotonFlotante();
            actualizarStockEnItemView(productoId);
        }
        window.eliminarDelCarrito = (id) => {
            // Actualizar contador y stock en el header
            const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
            if (headerItem) {
                const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                if (cantidadSpan) cantidadSpan.textContent = '';
                cantidadSpan.style.display = 'none';
            }

            // Elimina el item del DOM y actualiza totales
            const itemToRemove = document.querySelector(`.carrito-item[data-id="${id}"]`);
            if (itemToRemove) itemToRemove.remove();
            actualizarTotalesCarrito();

            if (carritoSalidas.size === 0) {
                ocultarScreen();
                mostrarNotificacion('carrito vacio');
            }
            carritoSalidas.delete(id);
            actualizarCarritoLocal();
            actualizarBotonFlotante();
        };


        function actualizarBotonFlotante() {
            const botonFlotante = document.querySelector('.btn-flotante-salidas');
            if (!botonFlotante) return;

            botonFlotante.style.display = carritoSalidas.size > 0 ? 'flex' : 'none';
            botonFlotante.innerHTML = `
                    <i class="bx bx-cart"></i>
                    <span class="cantidad">${carritoSalidas.size}</span>
                `;
        }
        actualizarBotonFlotante();
        function mostrarCarritoSalidas() {
            const contenido = document.querySelector('.screen');

            const subtotal = Array.from(carritoSalidas.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
            let descuento = 0;
            let aumento = 0;

            const registrationHTML = `
                    <div class="top-view">
                        <div class="encabezado">
                            <div class="titulo-back">
                                <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                                <p class="titulo">Salida</p>
                            </div>
                            <div class="botones-container">
                                <button class="btn-procesar-salida btn green" onclick="registrarSalida()"><i class='bx bx-export'></i> Procesar</button>
                                <button class="btn red filtros limpiar"><i class="bx bx-trash"></i></button>                           
                            </div>
                        </div>
                    </div>
                    <div class="contenido">
                        <div class="carrito-items">
                            ${Array.from(carritoSalidas.values()).map(item => {
                const producto = productos.find(p => p.id === item.id);
                let cantidadxgrupo = producto ? (producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1) : 1;
                let stockDisponible = modoTiraGlobal ?
                    (producto ? producto.stock : item.stock) :
                    (producto ? (producto.stock * cantidadxgrupo) : item.stock);
                let stockRestante = stockDisponible - item.cantidad;

                return `
                                <div class="carrito-item" data-id="${item.id}">
                                    <div class="item-info">
                                        <h3>${item.producto} - ${item.gramos}gr</h3>
                                        <div class="cantidad-control">
                                            <button class="btn-cantidad" style="color:var(--error)">-</button>
                                            <input type="number" value="${item.cantidad}" min="1" max="${stockDisponible}"
                                                onfocus="this.select()"
                                                onchange="actualizarCantidad('${item.id}', this.value)">
                                            <button class="btn-cantidad"style="color:var(--exito)">+</button>
                                        </div>
                                    </div>
                                    <div class="subtotal-delete">
                                        <div class="info-valores">
                                            <p class="stock-disponible">${stockRestante} Und.</p>
                                            <p class="unitario">Bs. ${(item.subtotal.toFixed(2))}</p>
                                            <p class="subtotal">Bs. ${(item.cantidad * item.subtotal.toFixed(2))}</p>
                                        </div>
                                        <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.id}')">
                                            <i class="bx bx-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `}).join('')}
                            <div class="carrito-total">
                                <div class="leyenda">
                                    <div class="item">
                                        <span class="punto orange"></span>
                                        <p>Stock actual</p>
                                    </div>
                                    <div class="item">
                                        <span class="punto blue-light"></span>
                                        <p>Precio unitario</p>
                                    </div>
                                    <div class="item">
                                        <span class="punto verde"></span>
                                        <p>Subtotal</p>
                                    </div>
                                </div>
                                <div class="campo-vertical">
                                    <span class="detalle-campo"><span>Subtotal: </span><span class="subtotal">Bs. ${subtotal.toFixed(2)}</span></span>
                                    <span class="detalle-campo total-final"><span>Total Final: </span>Bs. ${subtotal.toFixed(2)}</span>
                                </div>
                                <div class="entrada">
                                    <i class='bx bx-label'></i>
                                    <div class="input">
                                        <p class="detalle">Nombre del movimiento</p>
                                        <input class="nombre-movimiento" type="text" autocomplete="off" placeholder=" " required>
                                    </div>
                                </div>
                                <div class="campo-horizontal">
                                    <div class="entrada">
                                        <i class='bx bx-purchase-tag-alt'></i>
                                        <div class="input">
                                            <p class="detalle">Descuento</p>
                                            <input class="descuento" type="number" autocomplete="off" placeholder=" " required>
                                        </div>
                                    </div>
                                    <div class="entrada">
                                        <i class='bx bx-plus'></i>
                                        <div class="input">
                                            <p class="detalle">Aumento</p>
                                            <input class="aumento" type="number" autocomplete="off" placeholder=" " required>
                                        </div>
                                    </div>
                                </div>
                                <div class="campo-horizontal">
                                    <div class="entrada">
                                        <i class='bx bx-user'></i>
                                        <div class="input">
                                            <p class="detalle">Cliente</p>
                                            <select class="select-cliente" required>
                                                <option value=""></option>
                                                ${clientes.map(cliente => `
                                                    <option value="${cliente.nombre}(${cliente.id})">${cliente.nombre}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="entrada">
                                        <i class='bx bx-money'></i>
                                        <div class="input">
                                            <p class="detalle">Estado</p>
                                            <select class="select" required>
                                                <option value="" disabled selected></option>
                                                <option value="pagado">Pagado</option>
                                                <option value="no-pagado">No pagado</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="entrada">
                                    <i class='bx bx-comment-detail'></i>
                                    <div class="input">
                                        <p class="detalle">Observaciones</p>
                                        <input class="observaciones" type="text" autocomplete="off" placeholder=" " required>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            // Enlazar eventos a los botones de cantidad y los inputs
            contenido.querySelectorAll('.btn-cantidad').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.closest('.carrito-item').dataset.id;
                    const delta = this.textContent.trim() === '+' ? 1 : -1;
                    window.ajustarCantidad(id, delta);
                });
            });
            contenido.querySelectorAll('.carrito-item input[type="number"]').forEach(input => {
                input.addEventListener('change', function () {
                    const id = this.closest('.carrito-item').dataset.id;
                    window.actualizarCantidad(id, this.value);
                });
            });
            const inputDescuento = contenido.querySelector('.descuento');
            const inputAumento = contenido.querySelector('.aumento');
            if (inputDescuento) inputDescuento.addEventListener('input', actualizarTotalesCarrito);
            if (inputAumento) inputAumento.addEventListener('input', actualizarTotalesCarrito);

            const botonLimpiar = contenido.querySelector('.btn.filtros.limpiar');
            botonLimpiar.addEventListener('click', () => {

                carritoSalidas.forEach((item, id) => {
                    const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
                    if (headerItem) {
                        const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                        const stockSpan = headerItem.querySelector('.stock');
                        if (cantidadSpan) cantidadSpan.textContent = '';
                        cantidadSpan.style.display = 'none'
                        if (stockSpan) stockSpan.textContent = `${item.stock} Und.`;
                    }
                });

                carritoSalidas.clear();
                actualizarCarritoLocal();
                actualizarBotonFlotante();
                ocultarScreen();
                mostrarNotificacion('Se limpio el carrito');
                document.querySelector('.btn-flotante-salidas').style.display = 'none';
            });
        }
        window.actualizarCantidad = (id, valor) => {
            console.log('Actualizando cantidad:', id, valor);
            const item = carritoSalidas.get(id);
            if (!item) return;

            const producto = productos.find(p => p.id === id);
            if (!producto) return;

            const cantidad = parseInt(valor);
            let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
            let stockDisponible = modoTiraGlobal ? producto.stock : (producto.stock * cantidadxgrupo);

            if (cantidad > 0 && cantidad <= stockDisponible) {
                item.cantidad = cantidad;

                const carritoItem = document.querySelector(`.carrito-item[data-id="${id}"]`);
                if (carritoItem) {
                    const input = carritoItem.querySelector('input[type="number"]');
                    const subtotal = carritoItem.querySelector('.subtotal');
                    const stockDisponibleSpan = carritoItem.querySelector('.stock-disponible');

                    let stockRestante = stockDisponible - cantidad;

                    console.log('Stock disponible:', stockDisponible);
                    console.log('Nueva cantidad:', cantidad);
                    console.log('Stock restante:', stockRestante);

                    if (input) input.value = cantidad;
                    if (subtotal) subtotal.textContent = `Bs. ${(cantidad * item.subtotal).toFixed(2)}`;
                    if (stockDisponibleSpan) stockDisponibleSpan.textContent = `${stockRestante} Und.`;
                }

                actualizarCarritoLocal();
                actualizarTotalesCarrito();
                actualizarStockEnItemView(id);
            }
        };

        window.ajustarCantidad = (id, delta) => {
            console.log('Ajustando cantidad:', id, delta);
            const item = carritoSalidas.get(id);
            if (!item) return;

            const producto = productos.find(p => p.id === id);
            if (!producto) return;

            let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
            let stockDisponible = modoTiraGlobal ? producto.stock : (producto.stock * cantidadxgrupo);
            const nuevaCantidad = item.cantidad + delta;

            if (nuevaCantidad > 0 && nuevaCantidad <= stockDisponible) {
                item.cantidad = nuevaCantidad;

                const carritoItem = document.querySelector(`.carrito-item[data-id="${id}"]`);
                if (carritoItem) {
                    const input = carritoItem.querySelector('input[type="number"]');
                    const subtotal = carritoItem.querySelector('.subtotal');
                    const stockDisponibleSpan = carritoItem.querySelector('.stock-disponible');

                    let stockRestante = stockDisponible - nuevaCantidad;

                    console.log('Stock disponible:', stockDisponible);
                    console.log('Nueva cantidad:', nuevaCantidad);
                    console.log('Stock restante:', stockRestante);

                    if (input) input.value = nuevaCantidad;
                    if (subtotal) subtotal.textContent = `Bs. ${(nuevaCantidad * item.subtotal).toFixed(2)}`;
                    if (stockDisponibleSpan) stockDisponibleSpan.textContent = `${stockRestante} Und.`;
                }

                actualizarCarritoLocal();
                actualizarTotalesCarrito();
                actualizarStockEnItemView(id);
            }
        };

        function actualizarStockEnItemView(id) {
            console.log('Actualizando stock en vista para:', id);
            const producto = productos.find(p => p.id === id);
            if (!producto) {
                console.log('Producto no encontrado');
                return;
            }

            const item = document.querySelector(`.item-view[data-id="${id}"]`);
            if (!item) {
                console.log('Item view no encontrado');
                return;
            }

            let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
            let cantidadEnCarrito = carritoSalidas.get(id)?.cantidad || 0;
            let stockBase = modoTiraGlobal ? producto.stock : (producto.stock * cantidadxgrupo);
            let stockDisponible = stockBase - cantidadEnCarrito;

            console.log('Stock base:', stockBase);
            console.log('Cantidad en carrito:', cantidadEnCarrito);
            console.log('Stock disponible calculado:', stockDisponible);

            const stockSpan = item.querySelector('.flotante-view.blue.stock');
            if (stockSpan) {
                stockSpan.textContent = `${stockDisponible} Und.`;
                console.log('Stock actualizado en vista');
            }
        }
        function actualizarTotalesCarrito() {
            const subtotal = Array.from(carritoSalidas.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
            const inputDescuento = document.querySelector('.descuento');
            const inputAumento = document.querySelector('.aumento');

            const totalFinal = document.querySelector('.total-final');
            let descuentoValor = inputDescuento ? parseFloat(inputDescuento.value) || 0 : 0;
            let aumentoValor = inputAumento ? parseFloat(inputAumento.value) || 0 : 0;
            const totalCalculado = subtotal - descuentoValor + aumentoValor;

            // Subtotal
            const subtotalSpan = document.querySelector('.detalle-campo .subtotal');
            if (subtotalSpan) subtotalSpan.textContent = `Bs. ${subtotal.toFixed(2)}`;
            // Total
            if (totalFinal) totalFinal.innerHTML = `<span>Total Final: </span>Bs. ${totalCalculado.toFixed(2)}`;
        }
        function actualizarCarritoLocal() {
            localStorage.setItem('damabrava_carrito', JSON.stringify(Array.from(carritoSalidas.entries())));
        }
        async function registrarSalida() {
            const clienteSelect = document.querySelector('.select-cliente');
            const nombreMovimiento = document.querySelector('.nombre-movimiento');
            const estadoSelect = document.querySelector('.select');  // Nuevo
            const observacionesValor = document.querySelector('.observaciones').value;

            if (!clienteSelect.value) {
                mostrarNotificacion('Seleccione un cliente antes de continuar');
                return;
            } else if (!nombreMovimiento.value) {
                mostrarNotificacion('ingrese el nombre para el movimiento');
                return;
            }
            const fecha = new Date().toLocaleString('es-ES', {
                timeZone: 'America/La_Paz' // Puedes cambiar esto según tu país o ciudad
            });

            // --- NUEVO: Calcular tiras y sueltas para cada producto si aplica ---
            let actualizacionesStock = [];
            let sueltasPorProducto = {};
            let cantidadesSalida = [];
            let tirasSalida = [];
            let sueltasSalida = [];
            let productosSalida = [];
            let preciosUnitariosSalida = [];
            let subtotalSalida = 0;

            carritoSalidas.forEach((item, id) => {
                let cantidad = item.cantidad;
                let cantidadxgrupo = item.cantidadxgrupo ? parseInt(item.cantidadxgrupo) : 0;
                let modoUnitario = !modoTiraGlobal && cantidadxgrupo > 1;
                let tiras = 0, sueltas = 0, totalUnidades = cantidad;
                let stockSueltas = 0;
                // Buscar el stock de sueltas actual del producto
                const productoAlmacen = productos.find(p => p.id === id);
                if (productoAlmacen && productoAlmacen.uSueltas) {
                    stockSueltas = parseInt(productoAlmacen.uSueltas) || 0;
                }
                if (modoUnitario) {
                    if (cantidad <= stockSueltas) {
                        // Solo sacar de sueltas
                        tiras = 0;
                        sueltas = cantidad;
                        cantidadesSalida.push(cantidad);
                        tirasSalida.push(0);
                        sueltasSalida.push(cantidad);
                        productosSalida.push(`${item.producto} - ${item.gramos}gr`);
                        preciosUnitariosSalida.push(parseFloat(item.subtotal).toFixed(2));
                        subtotalSalida += cantidad * item.subtotal;
                        actualizacionesStock.push({
                            id: id,
                            cantidad: 0, // No se tocan tiras
                            restarSueltas: cantidad // Nuevo campo para backend
                        });
                    } else {
                        // Sacar todas las sueltas posibles, el resto en tiras
                        let faltante = cantidad - stockSueltas;
                        tiras = Math.ceil(faltante / cantidadxgrupo);
                        let totalUnidadesTiras = tiras * cantidadxgrupo;
                        let sobrante = totalUnidadesTiras - faltante;
                        // El nuevo stock de sueltas será el sobrante
                        cantidadesSalida.push(cantidad);
                        tirasSalida.push(tiras);
                        sueltasSalida.push(stockSueltas + sobrante);
                        productosSalida.push(`${item.producto} - ${item.gramos}gr`);
                        preciosUnitariosSalida.push(parseFloat(item.subtotal).toFixed(2));
                        subtotalSalida += cantidad * item.subtotal;
                        actualizacionesStock.push({
                            id: id,
                            cantidad: tiras, // Tiras a restar
                            restarSueltas: stockSueltas, // Restar todas las sueltas posibles
                            sumarSueltas: sobrante // Sumar el sobrante de la tira
                        });
                    }
                } else {
                    // Modo tira o productos sin agrupamiento
                    tiras = cantidad; // Aquí la cantidad ya es en tiras
                    sueltas = 0;
                    cantidadesSalida.push(cantidad);
                    tirasSalida.push(tiras);
                    sueltasSalida.push(0);
                    productosSalida.push(`${item.producto} - ${item.gramos}gr`);
                    preciosUnitariosSalida.push(parseFloat(item.subtotal).toFixed(2));
                    subtotalSalida += cantidad * item.subtotal;
                    actualizacionesStock.push({
                        id: id,
                        cantidad: tiras, // Aquí la cantidad es en tiras
                        sumarSueltas: 0
                    });
                }
            });

            const tipoMovimiento = modoTiraGlobal ? 'Tiras' : 'Unidades';
            const registroSalida = {
                fechaHora: fecha,
                tipo: 'Salida',
                idProductos: Array.from(carritoSalidas.values()).map(item => item.id).join(';'),
                productos: productosSalida.join(';'),
                cantidades: cantidadesSalida.join(';'),
                tiras: tirasSalida.join(';'), // Nuevo campo
                sueltas: sueltasSalida.join(';'), // Nuevo campo
                operario: `${usuarioInfo.nombre} ${usuarioInfo.apellido}`,
                clienteId: clienteSelect.value,
                nombre_movimiento: nombreMovimiento.value,
                subtotal: subtotalSalida,
                descuento: parseFloat(document.querySelector('.descuento').value) || 0,
                aumento: parseFloat(document.querySelector('.aumento').value) || 0,
                total: 0,
                observaciones: document.querySelector('.observaciones').value || 'Ninguna',
                precios_unitarios: preciosUnitariosSalida.join(';'),
                estado: estadoSelect.value,
                tipoMovimiento // Nuevo campo para backend
            };
            registroSalida.total = registroSalida.subtotal - registroSalida.descuento + registroSalida.aumento;

            try {
                mostrarCarga();
                // Primero registramos el movimiento
                const response = await fetch('/registrar-movimiento', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('damabrava_token')}`
                    },
                    body: JSON.stringify(registroSalida)
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Error en la respuesta del servidor');
                }

                // --- NUEVO: Actualizar el stock en Almacen general considerando sueltas ---
                const responseStock = await fetch('/actualizar-stock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('damabrava_token')}`
                    },
                    body: JSON.stringify({
                        actualizaciones: actualizacionesStock,
                        tipo: 'salida'
                    })
                });

                const dataStock = await responseStock.json();

                if (!responseStock.ok || !dataStock.success) {
                    throw new Error(dataStock.error || 'Error al actualizar el stock');
                }

                // Limpiar carrito y actualizar UI
                carritoSalidas.clear();
                localStorage.removeItem('damabrava_carrito');
                document.querySelector('.btn-flotante-salidas').style.display = 'none';
                ocultarScreen();
                ocultarCarga();
                mostrarNotificacion('Se registro la salida', { tipo: 'exito', duracion: 2000 })
                await mostrarAlmacenGeneral();
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al registrar la salida', { tipo: 'error' })
            } finally {
                ocultarCarga();
            }
        }
        window.registrarSalida = registrarSalida;
    } else if (tipoEvento === 'ingresos') {

        const botonCarrito = document.querySelector('.btn-flotante-ingresos')
        botonCarrito.addEventListener('click', mostrarCarritoIngresos);
        items.forEach(item => {
            item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
        });

        const switchTiraGlobal = document.querySelector('.switch-tira-global');
        if (switchTiraGlobal) {
            switchTiraGlobal.addEventListener('change', (e) => {
                modoTiraGlobal = e.target.checked;

                // Actualizar estilos del switch
                const slider = e.target.nextElementSibling;

                if (modoTiraGlobal) {
                    mostrarNotificacion('Se cambio a modo tira');
                } else {
                    mostrarNotificacion('Se cambio a modo unidades');
                }

                // Actualizar precios y stock en los items
                productos.forEach(producto => {
                    const item = document.querySelector(`.item-view[data-id="${producto.id}"]`);
                    if (!item) return;

                    // Calcular precio según modo
                    let precioUnitario = 0;
                    if (producto.precios) {
                        const primerPrecio = producto.precios.split(';')[0];
                        const partes = primerPrecio.split(',');
                        if (partes.length > 1) {
                            precioUnitario = !isNaN(parseFloat(partes[1])) ? parseFloat(partes[1]) : 0;
                        }
                    }
                    let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
                    let precioMostrar = modoTiraGlobal ? (precioUnitario * cantidadxgrupo).toFixed(2) : precioUnitario.toFixed(2);

                    // Calcular stock según modo
                    let cantidadEnCarrito = carritoSalidas.get(producto.id)?.cantidad || 0;
                    let stockMostrar = modoTiraGlobal ?
                        (producto.stock - cantidadEnCarrito) :
                        ((producto.stock * cantidadxgrupo) - cantidadEnCarrito);

                    // Actualizar DOM
                    const precioSpan = item.querySelector('.flotante-view.orange');
                    const stockSpan = item.querySelector('.flotante-view.blue.stock');
                    if (precioSpan) precioSpan.textContent = `Bs. ${precioMostrar}`;
                    if (stockSpan) stockSpan.textContent = `${stockMostrar} Und.`;
                });

                // Actualizar precios y stock en el carrito
                carritoIngresos.forEach((item, id) => {
                    const producto = productos.find(p => p.id === id);
                    if (!producto) return;

                    let precioUnitario = 0;
                    if (producto.precios) {
                        const primerPrecio = producto.precios.split(';')[0];
                        const partes = primerPrecio.split(',');
                        if (partes.length > 1) {
                            precioUnitario = !isNaN(parseFloat(partes[1])) ? parseFloat(partes[1]) : 0;
                        }
                    }
                    let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
                    item.subtotal = modoTiraGlobal ? precioUnitario * cantidadxgrupo : precioUnitario;
                    item.stock = modoTiraGlobal ? producto.stock : (producto.stock * cantidadxgrupo);
                });
                actualizarTotalesCarrito();
            });
        }

        window.actualizarSpan = (productoId) => {
            const producto = productos.find(p => p.id === productoId);
            const selectPrecios = document.querySelector('.precios-select');
            const ciudadSeleccionada = selectPrecios.options[selectPrecios.selectedIndex].text;
            const preciosProducto = producto.precios.split(';');
            const precioSeleccionado = preciosProducto.find(p => p.split(',')[0] === ciudadSeleccionada);
            const valor = precioSeleccionado ? precioSeleccionado.split(',')[1] : '0';
            let precioUnitario = !isNaN(parseFloat(valor)) ? parseFloat(valor) : 0;
            let cantidadxgrupo = producto.cantidadxgrupo ? parseInt(producto.cantidadxgrupo) : 1;
            let precioFinal = modoTiraGlobal ? precioUnitario * cantidadxgrupo : precioUnitario;
            const item = document.querySelector(`.item-view[data-id="${productoId}"]`);
            if (item) {
                item.classList.add('agregado-al-carrito');
                setTimeout(() => {
                    item.classList.remove('agregado-al-carrito');
                }, 500);
            }

            if (carritoIngresos.has(productoId)) {
                const itemCarrito = carritoIngresos.get(productoId);
                itemCarrito.cantidad += 1;
                if (item) {
                    const cantidadSpan = item.querySelector('.carrito-cantidad');
                    if (cantidadSpan) {
                        if (itemCarrito.cantidad > 0) {
                            cantidadSpan.style.display = '';
                            cantidadSpan.textContent = itemCarrito.cantidad;
                        } else {
                            cantidadSpan.style.display = 'none';
                            cantidadSpan.textContent = '';
                        }
                    }
                }
            } else {
                carritoIngresos.set(productoId, {
                    ...producto,
                    cantidad: 1,
                    subtotal: precioFinal // calcula precioFinal según modo tira/unidades
                });
                if (item) {
                    const cantidadSpan = item.querySelector('.carrito-cantidad');
                    if (cantidadSpan) {
                        cantidadSpan.style.display = '';
                        cantidadSpan.textContent = '1';
                    }
                }
            }
        }
        window.actualizarSpanSolo = (productoId) => {
            const item = document.querySelector(`.item-view[data-id="${productoId}"]`);
            if (!item) return;

            const itemCarrito = carritoIngresos.get(productoId);
            if (itemCarrito) {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                if (cantidadSpan) {
                    if (itemCarrito.cantidad > 0) {
                        cantidadSpan.style.display = '';
                        cantidadSpan.textContent = itemCarrito.cantidad;
                    } else {
                        cantidadSpan.style.display = 'none';
                        cantidadSpan.textContent = '';
                    }
                }
            } else {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                if (cantidadSpan) {
                    cantidadSpan.style.display = 'none';
                    cantidadSpan.textContent = '';
                }
            }
        }


        function agregarAlCarrito(productoId) {
            const producto = productos.find(p => p.id === productoId);
            if (!producto) return;

            // Agregar efecto visual al item
            const item = document.querySelector(`.item-view[data-id="${productoId}"]`);
            if (item) {
                item.classList.add('agregado-al-carrito');
                setTimeout(() => {
                    item.classList.remove('agregado-al-carrito');
                }, 500);
            }

            actualizarSpan(productoId);
            actualizarCarritoLocal();
            actualizarBotonFlotante();
            actualizarStockEnItemView(productoId); // Cambiado a actualizarStockEnItemView
        }
        window.eliminarDelCarrito = (id) => {
            // Actualizar contador y stock en el header
            const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
            if (headerItem) {
                const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                if (cantidadSpan) cantidadSpan.textContent = '';
                cantidadSpan.style.display = 'none';
            }

            // Elimina el item del DOM y actualiza totales
            const itemToRemove = document.querySelector(`.carrito-item[data-id="${id}"]`);
            if (itemToRemove) itemToRemove.remove();
            actualizarTotalesCarrito();

            if (carritoIngresos.size === 0) {
                ocultarScreen();
                mostrarNotificacion('carrito vacio');
            }
            carritoIngresos.delete(id);
            actualizarCarritoLocal();
            actualizarBotonFlotante();
        };


        function actualizarBotonFlotante() {
            const botonFlotante = document.querySelector('.btn-flotante-ingresos');
            if (!botonFlotante) return;

            botonFlotante.style.display = carritoIngresos.size > 0 ? 'flex' : 'none';
            botonFlotante.innerHTML = `
                <i class="bx bx-cart"></i>
                <span class="cantidad">${carritoIngresos.size}</span>
            `;
        }
        actualizarBotonFlotante();
        function mostrarCarritoIngresos() {
            const contenido = document.querySelector('.screen');

            const subtotal = Array.from(carritoIngresos.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
            let descuento = 0;
            let aumento = 0;

            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Ingreso</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-procesar-salida btn trans" onclick="registrarIngreso()"><i class='bx bx-import'></i> Procesar</button>
                            <button class="btn  red filtros limpiar"><i class="bx bx-trash"></i></button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <div class="carrito-items">
                    ${Array.from(carritoIngresos.values()).map(item => {
                const producto = productos.find(p => p.id === item.id);
                // Simplificar el cálculo del stock para ingresos
                let stockActual = parseInt(producto?.stock) || 0;
                let stockRestante = stockActual + item.cantidad; // Para ingresos sumamos directamente

                return `
                        
                        <div class="carrito-item" data-id="${item.id}">
                            <div class="item-info">
                                <h3>${item.producto} - ${item.gramos}gr</h3>
                                <div class="cantidad-control">
                                    <button class="btn-cantidad" style="color:var(--error)">-</button>
                                    <input type="number" value="${item.cantidad}" min="1"
                                        onfocus="this.select()"
                                        onchange="actualizarCantidad('${item.id}', this.value)">
                                    <button class="btn-cantidad" style="color:var(--exito)">+</button>
                                </div>
                            </div>
                            <div class="subtotal-delete">
                                <div class="info-valores">
                                    <p class="stock-disponible">${stockRestante} Und.</p>
                                    <p class="unitario">Bs. ${(item.subtotal).toFixed(2)}</p>
                                    <p class="subtotal">Bs. ${(item.cantidad * item.subtotal).toFixed(2)}</p>
                                </div>
                                <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.id}')">
                                    <i class="bx bx-trash"></i>
                                </button>
                            </div>
                        </div>
                        `}).join('')}
                            <div class="carrito-total">
                                <div class="leyenda">
                                    <div class="item">
                                        <span class="punto orange"></span>
                                        <p>Stock actual</p>
                                    </div>
                                    <div class="item">
                                        <span class="punto blue-light"></span>
                                        <p>Precio unitario</p>
                                    </div>
                                    <div class="item">
                                        <span class="punto verde"></span>
                                        <p>Subtotal</p>
                                    </div>
                                </div>
                                <div class="campo-vertical">
                                    <div class="detalle-campo"><span>Subtotal: </span><span class="subtotal">Bs. ${subtotal.toFixed(2)}</span></div>
                                    <div class="total-final detalle-campo"><span>Total Final: </span>Bs. ${subtotal.toFixed(2)}</div>
                                </div>
                                <div class="entrada">
                                    <i class='bx bx-label'></i>
                                    <div class="input">
                                        <p class="detalle">Nombre del movimiento</p>
                                        <input class="nombre-movimiento" type="text" autocomplete="off" placeholder=" " required>
                                    </div>
                                </div>
                                <div class="campo-horizontal">
                                    <div class="entrada">
                                        <i class='bx bx-purchase-tag-alt'></i>
                                        <div class="input">
                                            <p class="detalle">Descuento</p>
                                            <input class="descuento" type="number" autocomplete="off" placeholder=" " required>
                                        </div>
                                    </div>
                                    <div class="entrada">
                                        <i class='bx bx-plus'></i>
                                        <div class="input">
                                            <p class="detalle">Aumento</p>
                                            <input class="aumento" type="number" autocomplete="off" placeholder=" " required>
                                        </div>
                                    </div>
                                </div>
                                <div class="entrada">
                                    <i class='bx bx-user'></i>
                                    <div class="input">
                                        <p class="detalle">Selecciona proovedor</p>
                                        <select class="select-proovedor" required>
                                            <option value=""></option>
                                            ${proveedores.map(proovedor => `
                                                <option value="${proovedor.nombre}(${proovedor.id})">${proovedor.nombre}</option>
                                            `).join('')}
                                            ${nombresUsuariosGlobal
                    .filter(proveedor => proveedor.rol === 'Producción')
                    .map(proveedor => `
                                                <option value="${proveedor.nombre}(${proveedor.id})">${proveedor.nombre}</option>
                                                `).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-comment-detail'></i>
                                <div class="input">
                                    <p class="detalle">Observaciones</p>
                                    <input class="Observaciones" type="text" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
        
                        </div>
                        </div>
                    </div>
                `;
            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            // Enlazar eventos a los botones de cantidad y los inputs
            contenido.querySelectorAll('.btn-cantidad').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.closest('.carrito-item').dataset.id;
                    const delta = this.textContent.trim() === '+' ? 1 : -1;
                    window.ajustarCantidad(id, delta);
                });
            });
            contenido.querySelectorAll('.carrito-item input[type="number"]').forEach(input => {
                input.addEventListener('change', function () {
                    const id = this.closest('.carrito-item').dataset.id;
                    window.actualizarCantidad(id, this.value);
                });
            });
            const inputDescuento = contenido.querySelector('.descuento');
            const inputAumento = contenido.querySelector('.aumento');
            if (inputDescuento) inputDescuento.addEventListener('input', actualizarTotalesCarrito);
            if (inputAumento) inputAumento.addEventListener('input', actualizarTotalesCarrito);

            const botonLimpiar = contenido.querySelector('.btn.filtros.limpiar');
            botonLimpiar.addEventListener('click', () => {

                carritoIngresos.forEach((item, id) => {
                    const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
                    if (headerItem) {
                        const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                        const stockSpan = headerItem.querySelector('.stock');
                        if (cantidadSpan) cantidadSpan.textContent = '';
                        cantidadSpan.style.display = 'none'
                        if (stockSpan) stockSpan.textContent = `${item.stock} Und.`;
                    }
                });

                carritoIngresos.clear();
                actualizarCarritoLocal();
                actualizarBotonFlotante();
                ocultarScreen();
                mostrarNotificacion('Se limpio el carrito');
                document.querySelector('.btn-flotante-ingresos').style.display = 'none';
            });
        }
        window.actualizarCantidad = (id, valor) => {
            const item = carritoIngresos.get(id);
            if (!item) return;

            const producto = productos.find(p => p.id === id);
            if (!producto) return;

            const cantidad = parseInt(valor);
            if (cantidad > 0) {
                item.cantidad = cantidad;

                const carritoItem = document.querySelector(`.carrito-item[data-id="${id}"]`);
                if (carritoItem) {
                    const input = carritoItem.querySelector('input[type="number"]');
                    const subtotal = carritoItem.querySelector('.subtotal');
                    const stockDisponibleSpan = carritoItem.querySelector('.stock-disponible');

                    let stockActual = parseInt(producto.stock) || 0;
                    let nuevoStock = stockActual + cantidad;

                    console.log('Stock actual:', stockActual);
                    console.log('Nueva cantidad:', cantidad);
                    console.log('Nuevo stock calculado:', nuevoStock);

                    if (input) input.value = cantidad;
                    if (subtotal) subtotal.textContent = `Bs. ${(item.cantidad * item.subtotal).toFixed(2)}`;
                    if (stockDisponibleSpan) stockDisponibleSpan.textContent = `${nuevoStock} Und.`;
                }

                actualizarCarritoLocal();
                actualizarTotalesCarrito();
                actualizarStockEnItemView(id);
            }
        };

        window.ajustarCantidad = (id, delta) => {
            const item = carritoIngresos.get(id);
            if (!item) return;

            const producto = productos.find(p => p.id === id);
            if (!producto) return;

            const nuevaCantidad = item.cantidad + delta;

            if (nuevaCantidad > 0) {
                item.cantidad = nuevaCantidad;

                const carritoItem = document.querySelector(`.carrito-item[data-id="${id}"]`);
                if (carritoItem) {
                    const input = carritoItem.querySelector('input[type="number"]');
                    const subtotal = carritoItem.querySelector('.subtotal');
                    const stockDisponibleSpan = carritoItem.querySelector('.stock-disponible');

                    let stockActual = parseInt(producto.stock) || 0;
                    // Para ingresos, simplemente sumamos la nueva cantidad al stock actual
                    let stockRestante = stockActual + nuevaCantidad;

                    if (input) input.value = nuevaCantidad;
                    if (subtotal) subtotal.textContent = `Bs. ${(item.cantidad * item.subtotal).toFixed(2)}`;
                    if (stockDisponibleSpan) {
                        stockDisponibleSpan.textContent = `${stockRestante} Und.`;
                    }
                }

                actualizarCarritoLocal();
                actualizarTotalesCarrito();
                // Actualizar también la vista principal
                actualizarStockEnItemView(id);
            }
        };

        function actualizarStockEnItemView(id) {
            const producto = productos.find(p => p.id === id);
            if (!producto) {
                console.log('Producto no encontrado');
                return;
            }

            const item = document.querySelector(`.item-view[data-id="${id}"]`);
            if (!item) {
                console.log('Item view no encontrado');
                return;
            }

            // Obtener valores base
            let cantidadEnCarrito = carritoIngresos.get(id)?.cantidad || 0;
            let stockActual = parseInt(producto.stock) || 0;

            // Para ingresos, simplemente sumamos la cantidad en carrito al stock actual
            let stockDisponible = stockActual + cantidadEnCarrito;

            const stockSpan = item.querySelector('.flotante-view.blue.stock');
            if (stockSpan) {
                stockSpan.textContent = `${stockDisponible} Und.`;
            }
        }

        function actualizarTotalesCarrito() {
            const subtotal = Array.from(carritoIngresos.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
            const inputDescuento = document.querySelector('.descuento');
            const inputAumento = document.querySelector('.aumento');

            const totalFinal = document.querySelector('.total-final');
            let descuentoValor = inputDescuento ? parseFloat(inputDescuento.value) || 0 : 0;
            let aumentoValor = inputAumento ? parseFloat(inputAumento.value) || 0 : 0;
            const totalCalculado = subtotal - descuentoValor + aumentoValor;

            // Subtotal
            const subtotalSpan = document.querySelector('.detalle-campo .subtotal');
            if (subtotalSpan) subtotalSpan.textContent = `Bs. ${subtotal.toFixed(2)}`;
            // Total
            if (totalFinal) totalFinal.innerHTML = `<span>Total Final: </span>Bs. ${totalCalculado.toFixed(2)}`;
        }
        function actualizarCarritoLocal() {
            localStorage.setItem('damabrava_carrito_ingresos', JSON.stringify(Array.from(carritoIngresos.entries())));
        }

        async function registrarIngreso() {
            const proovedorSelect = document.querySelector('.select-proovedor');
            const nombreMovimiento = document.querySelector('.nombre-movimiento');
            const observacionesValor = document.querySelector('.Observaciones').value;
            if (!proovedorSelect.value) {
                mostrarNotificacion('Selecciona un proveedor antes de continuar');
                return;
            }
            if (!nombreMovimiento.value) {
                mostrarNotificacion('Ingresa el nombre del movimiento antes de continuar');
                return;
            }
            const fecha = new Date().toLocaleString('es-ES', {
                timeZone: 'America/La_Paz' // Puedes cambiar esto según tu país o ciudad
            });
            const tipoMovimiento = modoTiraGlobal ? 'Tiras' : 'Unidades';
            const registroIngreso = {
                fechaHora: fecha,
                tipo: 'Ingreso',
                idProductos: Array.from(carritoIngresos.values()).map(item => item.id).join(';'),  // Nuevo
                productos: Array.from(carritoIngresos.values()).map(item => `${item.producto} - ${item.gramos}gr`).join(';'),
                cantidades: Array.from(carritoIngresos.values()).map(item => item.cantidad).join(';'),
                operario: `${usuarioInfo.nombre} ${usuarioInfo.apellido}`,
                clienteId: proovedorSelect.value,
                nombre_movimiento: nombreMovimiento.value,
                subtotal: Array.from(carritoIngresos.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0),
                descuento: parseFloat(document.querySelector('.descuento').value) || 0,
                aumento: parseFloat(document.querySelector('.aumento').value) || 0,
                total: 0,
                observaciones: document.querySelector('.Observaciones').value || 'Ninguna',
                precios_unitarios: Array.from(carritoIngresos.values())
                    .map(item => parseFloat(item.subtotal).toFixed(2))
                    .join(';'),
                estado: '',  // Nuevo
                tipoMovimiento // Nuevo campo para backend
            };

            registroIngreso.total = registroIngreso.subtotal - registroIngreso.descuento + registroIngreso.aumento;

            try {
                mostrarCarga();
                const response = await fetch('/registrar-movimiento', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('damabrava_token')}`
                    },
                    body: JSON.stringify(registroIngreso)
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Error en la respuesta del servidor');
                }

                // Actualizar el stock en Almacen general
                const actualizacionesStock = Array.from(carritoIngresos.values()).map(item => {
                    const cantidad = item.cantidad;
                    const cantidadxgrupo = item.cantidadxgrupo ? parseInt(item.cantidadxgrupo) : 0;
                    const modoUnitario = !modoTiraGlobal && cantidadxgrupo > 1;
                    if (modoUnitario) {
                        const tiras = Math.floor(cantidad / cantidadxgrupo);
                        const sueltas = cantidad % cantidadxgrupo;
                        return {
                            id: item.id,
                            cantidad: tiras, // tiras completas al stock
                            sumarSueltas: sueltas // unidades sueltas
                        };
                    } else {
                        // Modo tira o productos sin agrupamiento
                        return {
                            id: item.id,
                            cantidad: cantidad, // todo va al stock
                            sumarSueltas: 0
                        };
                    }
                });

                const responseStock = await fetch('/actualizar-stock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('damabrava_token')}`
                    },
                    body: JSON.stringify({
                        actualizaciones: actualizacionesStock,
                        tipo: 'ingreso'  // Especificamos que es un ingreso
                    })
                });

                const dataStock = await responseStock.json();

                if (!responseStock.ok || !dataStock.success) {
                    throw new Error(dataStock.error || 'Error al actualizar el stock');
                }

                // Limpiar carrito y actualizar UI
                carritoIngresos.clear();
                localStorage.removeItem('damabrava_carrito_ingresos');
                document.querySelector('.btn-flotante-ingresos').style.display = 'none';
                mostrarNotificacion('Se registro el ingreso', { tipo: 'exito', duracion: 2000 });
                ocultarCarga();
                ocultarScreen();
                await mostrarAlmacenGeneral();
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al registrar el ingreso', { tipo: 'error' });
            } finally {
                ocultarCarga();
            }
        }
        window.registrarIngreso = registrarIngreso;

    } 


    if (tipoEvento === 'almacen' || tipoEvento === 'conteo') {
        // Oculta todos los spans de cantidad del carrito
        const cantidadSpan = document.querySelectorAll('.item-view .carrito-cantidad');
        cantidadSpan.forEach(item => {
            item.style.display = 'none';
        });
        // Oculta el botón flotante del carrito si existe
        const botonFlotante = document.querySelector('.btn-flotante-salidas');
        if (botonFlotante) {
            botonFlotante.style.display = 'none';
        }
    }

    aplicarFiltros();
}