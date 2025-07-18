let productos = [];
let etiquetasGlobal = [];
let precios = [];
let precioWebSeleccionado = '';
const DB_NAME = 'damabrava_db';
const PRODUCTO_ALM_DB = 'prductos_alm';
const ETIQUETAS_WEB_DB = 'etiquetas_web';
const PRECIOS_ALM_DB = 'precios_alm';
const PRECIO_WEB_DB = 'precio_web';


async function obtenerEtiquetasWeb() {
    try {
        const etiquetasWebCache = await obtenerLocal(ETIQUETAS_WEB_DB, DB_NAME);

        if (etiquetasWebCache.length > 0) {
            etiquetasGlobal = etiquetasWebCache[0]?.data || [];
            console.log('actulizando desde el cache etiquetas')
        }
        try {
            const response = await fetch('/obtener-etiquetas-web');
            const data = await response.json();
            if (data.success) {
                // El endpoint devuelve un array de strings
                etiquetasGlobal = (data.etiquetas || []).filter(Boolean);

                if (JSON.stringify(etiquetasWebCache[0]) !== JSON.stringify(etiquetasGlobal)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    (async () => {
                        try {
                            const db = await initDB(ETIQUETAS_WEB_DB, DB_NAME);
                            const tx = db.transaction(ETIQUETAS_WEB_DB, 'readwrite');
                            const store = tx.objectStore(ETIQUETAS_WEB_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar el array completo como un solo registro
                            await store.put({
                                id: 'etiquetas_web',
                                data: etiquetasGlobal,
                                timestamp: Date.now()
                            });

                            console.log('Caché actualizado correctamente etiquetas');
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
                console.error('Error al obtener etiquetas');
                return false;
            }

        } catch (error) {
            console.error('Error al obtener etiquetas:', error);
            return false;
            throw error;
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
async function obtenerPrecioWebSeleccionado() {
    try {
        // 1. Intentar obtener del cache
        const precioCache = await obtenerLocal(PRECIO_WEB_DB, DB_NAME);
        if (precioCache && precioCache.length > 0) {
            precioWebSeleccionado = precioCache[0];
            console.log(precioWebSeleccionado)
            // Puedes actualizar la UI aquí si quieres mostrar el cache rápido
        }

        // 2. Obtener del servidor
        const response = await fetch('/obtener-precio-web');
        const data = await response.json();

        if (data.success && data.precio) {
            precioWebSeleccionado = data.precio;

            // 3. Si el precio es diferente al cache, actualiza el cache usando un bloque async IIFE como en otros módulos
            if (JSON.stringify(precioCache[0]) !== JSON.stringify(precioWebSeleccionado)) {
                console.log('Diferencias encontradas, actualizando UI');
                (async () => {
                    try {
                        const db = await initDB(PRECIO_WEB_DB, DB_NAME);
                        const tx = db.transaction(PRECIO_WEB_DB, 'readwrite');
                        const store = tx.objectStore(PRECIO_WEB_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        await store.put({
                            id: 'precio_web',
                            data: precioWebSeleccionado,
                            timestamp: Date.now()
                        });

                        console.log('Caché actualizado correctamente');
                    } catch (error) {
                        console.error('Error actualizando el caché:', error);
                    }
                })();
            }
            else {
                console.log('no son diferentes')
            }
        } else {
            precioWebSeleccionado = '';
        }
    } catch (error) {
        precioWebSeleccionado = '';
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


export async function mostrarPaginaWeb() {
    renderInitialHTML();
    // Obtener productos y precios del servidor
    const [productos, precios, etiquetas, precio_web] = await Promise.all([
        obtenerEtiquetasWeb(),
        obtenerPrecios(),
        obtenerPrecioWebSeleccionado(),
        await obtenerAlmacenGeneral(),
    ]);;
}
function renderInitialHTML() {
    const view = document.querySelector('.paginaWeb-cont');

    const initialHTML = `  
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <p class="titulo">Pagina web</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-etiquetas btn blue" style="width:40px"><i class='bx bx-purchase-tag'></i></button>
                        <button class="btn-precios btn orange"style="width:40px"><i class='bx bx-dollar'></i></button>
                        <button class="btn-catalogo btn red"style="width:40px"><i class='bx bxs-file-pdf'></i></button>
                    </div>
                </div>
                <div class="buscador-view">
                    <button class="lupa"><i class='bx bx-search'></i></button>
                    <input type="text" class="search" placeholder="Buscar...">
                    <button class="limpiar-search"><i class='bx bx-x'></i></button>
                </div>
                <div class="filtros-view">
                    <button class="btn-filtro todos activado">Todos</button>
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
async function updateHTMLWithData() {
    // Cambia el selector al nuevo nombre de clase
    const etiquetasFilter = document.querySelector('.filtros-view');
    if (etiquetasFilter) {
        // Renderiza los botones de etiquetas siempre
        let etiquetasHTML = '<button class="btn-filtro todos activado">Todos</button>';
        if (etiquetasGlobal && etiquetasGlobal.length > 0) {
            etiquetasHTML += etiquetasGlobal.map(etiqueta => `
                <button class="btn-filtro" data-etiqueta="${etiqueta}">${etiqueta}</button>
            `).join('');
        }
        etiquetasFilter.innerHTML = etiquetasHTML;
    }

    // Cambia el selector al nuevo nombre de clase
    const productosContainer = document.querySelector('.paginaWeb-cont .contenido-view');
    if (!productosContainer) return;
    // Filtra productos por etiqueta 'Web' antes de renderizar
    const productosWeb = productos.filter(producto => {
        if (!producto.etiquetas) return false;
        const etiquetas = producto.etiquetas.split(';').map(e => e.trim());
        return etiquetas.includes('Web');
    });
    const productosHTML = await Promise.all(productosWeb.map(async producto => {
        // Buscar el precio por nombre seleccionado
        let precioMostrar = 'Precio no disponible';
        const nombrePrecioSeleccionado = precioWebSeleccionado;
        if (producto.precios) {
            if (Array.isArray(producto.precios)) {
                // Si es array de objetos
                const precioObj = producto.precios.find(p =>
                    p.nombre && p.nombre.trim().toLowerCase() === nombrePrecioSeleccionado.trim().toLowerCase()
                );
                if (precioObj) {
                    precioMostrar = `Bs. ${(!isNaN(parseFloat(precioObj.valor)) ? parseFloat(precioObj.valor).toFixed(2) : '0.00')}`;
                }
                // LOG para debug

            } else if (typeof producto.precios === 'string') {
                // Si es string tipo "nombre,valor;nombre2,valor2"
                const preciosArr = producto.precios.split(';');
                const precioObj = preciosArr.find(p =>
                    p.split(',')[0].trim().toLowerCase() === nombrePrecioSeleccionado.trim().toLowerCase()
                );
                if (precioObj) {
                    const precio = parseFloat(precioObj.split(',')[1]);
                    precioMostrar = `Bs. ${(!isNaN(precio) ? precio.toFixed(2) : '0.00')}`;
                }
                // LOG para debug

            }
        }
        let imagenMostrar = '<i class=\'bx bx-package\'></i>';

        // Verificar si tiene promoción
        const tienePromocion = producto.promocion && producto.promocion.trim() !== '';
        const estrellaPromocion = tienePromocion ? '<i class="fa fa-star" style="color: #ffd700 !important; position: absolute; bottom: 10px; right: 10px; font-size: 15px; z-index: 10;"></i>' : '';
        const precioPromocional = tienePromocion && producto.precio_promocion ?
            `<span class="flotante-view red">Bs. ${(!isNaN(parseFloat(producto.precio_promocion)) ? parseFloat(producto.precio_promocion).toFixed(2) : '0.00')}</span>` : '';

        return `
            <div class="item-view" data-id="${producto.id}">
                ${estrellaPromocion}
                <div class="header-view">
                    ${imagenMostrar}
                    <div class="info-header">
                        <span class="id-flotante"><span class="id">${producto.id}</span>
                            ${precioPromocional || `<span class=" flotante-view orange">${precioMostrar}</span>`}
                        </span>
                        <span class="detalle">${producto.producto} - ${producto.gramos}gr.</span>
                        <span class="pie">${producto.etiquetas.split(';').join(' • ')}</span>
                    </div>
                </div>
                </div>
            </div>
        `;
    }));

    // Renderizar HTML
    productosContainer.innerHTML = productosHTML.join('');

    eventosAlmacenGeneral();
}


function eventosAlmacenGeneral() {
    const botonesEtiquetas = document.querySelectorAll('.filtros-view .btn-filtro');
    const btnEtiquetas = document.querySelectorAll('.btn-etiquetas');
    const btnPrecios = document.querySelectorAll('.btn-precios');
    const btnCatalogo = document.querySelectorAll('.btn-catalogo');
    const items = document.querySelectorAll('.item-view');
    const inputBusqueda = document.querySelector('.search');
    const btnLimpiar = document.querySelector('.limpiar-search');


    let filtroNombreActual = localStorage.getItem('filtroEtiquetaAlmacen') || 'Todos';

    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    function aplicarFiltros() {
        const busqueda = normalizarTexto(inputBusqueda.value);

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = productos.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;
            // Filtro por etiqueta seleccionada
            if (mostrar && filtroNombreActual && filtroNombreActual !== 'Todos') {
                const etiquetasProducto = registroData.etiquetas.split(';').map(e => e.trim());
                mostrar = etiquetasProducto.includes(filtroNombreActual);
            }

            // Filtro por búsqueda (mantener existente)
            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.producto,
                    registroData.gramos,
                    registroData.etiquetas,
                ].filter(Boolean).join(' ').toLowerCase();

                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        items.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        setTimeout(() => {
            items.forEach(registro => {
                registro.style.display = 'none';
            });

            registrosFiltrados.forEach(({ elemento, mostrar }, index) => {
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
    btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.focus();
        toggleLimpiarBtn();
        aplicarFiltros();
    });
    botonesEtiquetas.forEach(boton => {
        boton.classList.remove('activo');
        if (boton.textContent.trim() === filtroNombreActual) {
            boton.classList.add('activo');
        }
        boton.addEventListener('click', () => {
            botonesEtiquetas.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
            filtroNombreActual = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
            localStorage.setItem('filtroEtiquetaAlmacen', filtroNombreActual);
        });
    });
    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });


    window.info = async function (registroId) {
        const producto = productos.find(r => r.id === registroId);
        if (!producto) return;

        const etiquetasFormateados = producto.etiquetas.split(';')
            .filter(precio => precio.trim()) // Eliminar elementos vacíos
            .map(precio => {
                const [valor] = precio.split(';');
                return `<div class="detalle-campo"><span><i class='bx bx-tag'></i> ${valor}</span></div>`;
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
                        <button class="btn-promocionar btn orange" data-id="${producto.id}"><i class='bx bx-star'></i></button>
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Información general</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${producto.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-box'></i> Producto: </span>${producto.producto}</div>
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

                <p class="subtitulo">Etiquetas</p>
                <div class="campo-vertical">
                    ${etiquetasFormateados}
                </div>

                ${producto.promocion ? `
                <p class="subtitulo">Promoción</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-star'></i> Promoción: </span>${producto.promocion}</div>
                    <div class="detalle-campo"><span><i class='bx bx-dollar'></i> Precio promocional: </span>${producto.precio_promocion}</div>
                </div>
                ` : ''}
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();
        const btnPromocionar = contenido.querySelector('.btn-promocionar');
        btnPromocionar.addEventListener('click', () => promocionar(producto));

    }
    function promocionar(producto) {
        const contenido = document.querySelector('.screen2');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Promocionar</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-guardar-promocion btn orange"><i class='bx bx-star'></i>Promocionar</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <div class="pro-promo" style="display:none"></div>
                <p class="subtitulo">Información del producto</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${producto.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-cube'></i> Producto: </span>${producto.producto}</div>
                    <div class="detalle-campo"><span><i class="ri-scales-line"></i> Gramaje: </span>${producto.gramos}gr.</div>
                </div>
                
                <p class="subtitulo">Detalles de la promoción</p>
                <div class="entrada">
                    <i class='bx bx-star'></i>
                    <div class="input">
                        <p class="detalle">Nombre de la promoción</p>
                        <input class="nombre-promocion" type="text" value="${producto.promocion || ''}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-dollar'></i>
                    <div class="input">
                        <p class="detalle">Precio promocional (Bs.)</p>
                        <input class="precio-promocion" type="number" value="${producto.precio_promocion || ''}" step="0.01" min="0" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="info-sistema">
                    <i class='bx bx-info-circle'></i>
                    <div class="detalle-info">
                        <p>Al crear una promoción, el producto aparecerá con una estrella en la lista y mostrará el precio promocional. Deja los campos vacíos para quitar la promoción.</p>
                    </div>
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen2();

        // Agregar evento al botón guardar
        const btnGuardarPromocion = contenido.querySelector('.btn-guardar-promocion');
        btnGuardarPromocion.addEventListener('click', confirmarPromocion);

        async function confirmarPromocion() {
            const nombrePromocion = document.querySelector('.nombre-promocion').value.trim();
            const precioPromocion = document.querySelector('.precio-promocion').value.trim();

            try {
                mostrarCarga();
                const response = await fetch(`/actualizar-promocion/${producto.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        promocion: nombrePromocion,
                        precio_promocion: precioPromocion
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    await mostrarPaginaWeb();
                    updateHTMLWithData();
                    info(producto.id);
                    mostrarNotificacion('Promoción guardada', { tipo: 'exito', duracion:2000});
                } else {
                    mostrarNotificacion('Error al guardar la promoción', { tipo: 'error'});
                    throw new Error(data.error || 'Error al guardar la promoción');
                }
            } catch (error) {
                mostrarNotificacion('Error al guardar la promoción', { tipo: 'error'});
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        }
    }


    btnEtiquetas.forEach(btn => {
        btn.addEventListener('click', gestionarEtiquetas);
    });
    btnPrecios.forEach(btn => {
        btn.addEventListener('click', gestionarPrecios);
    });
    btnCatalogo.forEach(btn => {
        btn.addEventListener('click', async () => {
            mostrarModalCatalogo();
        });
    });


    function gestionarEtiquetas() {
        // Obtener todas las etiquetas únicas de los productos con etiqueta "Web"
        const todasLasEtiquetas = [];
        productos.forEach(producto => {
            if (producto.etiquetas) {
                const etiquetasProducto = producto.etiquetas.split(';').map(e => e.trim()).filter(e => e && e !== 'Web');
                etiquetasProducto.forEach(etiqueta => {
                    if (!todasLasEtiquetas.includes(etiqueta)) {
                        todasLasEtiquetas.push(etiqueta);
                    }
                });
            }
        });

        // Obtener las etiquetas seleccionadas actualmente
        // Usar etiquetasGlobal como seleccionadas
        const etiquetasSeleccionadas = etiquetasGlobal || [];

        const contenido = document.querySelector('.screen2');
        const etiquetasHTML = todasLasEtiquetas.map(etiqueta => `
            <label class="${etiqueta.toLowerCase().replace(/\s+/g, '-')}">
                <input type="checkbox" value="${etiqueta}" ${etiquetasSeleccionadas.includes(etiqueta) ? 'checked' : ''}>
                <span>${etiqueta}</span>
            </label>
        `).join('');

        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Etiquetas web</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-guardar-etiquetas btn green"><i class='bx bx-save'></i> Guardar</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Etiquetas disponibles</p>
                <div class="permisos-container">
                    ${etiquetasHTML}
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen2();

        // Guardar selección
        const btnGuardar = contenido.querySelector('.btn-guardar-etiquetas');
        btnGuardar.addEventListener('click', async () => {
            try {
                mostrarCarga();
                const checkboxes = contenido.querySelectorAll('input[type="checkbox"]:checked');
                const etiquetasSeleccionadas = Array.from(checkboxes).map(cb => cb.value);
                // Guardar en la hoja
                const response = await fetch('/guardar-etiquetas-web', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ etiquetas: etiquetasSeleccionadas })
                });

                const data = await response.json();
                if (data.success) {
                    updateHTMLWithData();
                    mostrarNotificacion('Etiquetas web guardadas correctamente',{tipo: 'exito', duracion: 2000 });
                } else {
                    mostrarNotificacion('Error al guardar etiquetas web',{tipo: 'error'});
                    throw new Error(data.error || 'Error al guardar etiquetas');
                }
            } catch (error) {
                mostrarNotificacion('Error al guardar etiquetas web',{tipo: 'error'});
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });
    }
    async function gestionarPrecios() {

        // Obtener todos los nombres de precios disponibles
        const nombresPrecios = precios.map(p => p.precio.split(';')[0].split(',')[0]);
        // Eliminar duplicados
        const nombresUnicos = [...new Set(nombresPrecios)];
        // Obtener el nombre seleccionado actualmente
        const precioSeleccionado = precioWebSeleccionado

        const contenido = document.querySelector('.screen2');
        const preciosHTML = nombresUnicos.map(nombre => `
            <label class="${nombre.toLowerCase().replace(/\s+/g, '-')}">
                <input type="radio" name="precio-web" value="${nombre}" ${nombre === precioSeleccionado ? 'checked' : ''}>
                <span>${nombre}</span>
            </label>
        `).join('');

        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Precios web</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-guardar-precio btn green"><i class='bx bx-save'></i> Guardar</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <div class="permisos-container">
                    ${preciosHTML}
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen2();


        // Guardar selección
        const btnGuardar = contenido.querySelector('.btn-guardar-precio');
        btnGuardar.addEventListener('click', async () => {
            try {
                mostrarCarga();
                const seleccionado = contenido.querySelector('input[name="precio-web"]:checked').value;

                // Guardar en la hoja
                const response = await fetch('/guardar-precio-web', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ precio: seleccionado })
                });

                const data = await response.json();
                if (data.success) {
                    updateHTMLWithData();
                    mostrarNotificacion('Precio web guardado', { tipo: 'exito', duracion: 2000 });
                } else {
                    mostrarNotificacion('Error al guardar el precio web', { tipo: 'error'});
                    throw new Error(data.error || 'Error al guardar precio');
                }
            } catch (error) {
                mostrarNotificacion('Error al guardar el precio web', { tipo: 'error'});
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });
    }
    async function mostrarModalCatalogo() {
        let urlCatalogo = null;
        console.log('[Catalogo] Intentando obtener catálogo PDF...');
        try {
            mostrarCargaObtener();
            const res = await fetch('/obtener-catalogo');
            const data = await res.json();
            if (data.success && data.url) urlCatalogo = data.url;
        } catch (err) {

            console.error('[Catalogo] Error al obtener catálogo:', err);
        }
        finally {
            ocultarCargaObtener();
        }
        const contenido = document.querySelector('.screen2');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Catalogo web</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn subir-catalogo btn orange" style="margin-bottom:10px"><i class='bx bx-upload'></i>Subir</button>
                        <button class="btn ver-catalogo btn green" style="margin-bottom:10px" ${!urlCatalogo ? 'disabled' : ''}><i class='bx bx-show'></i></button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <div class="pdf-upload-container" id="drop-zone">
                    <label for="catalogoPdf" class="pdf-upload-label" id="upload-label">
                        <i class="fas fa-file-upload"></i>
                        <span id="upload-text">Arrastra tu catálogo PDF o haz clic aquí</span>
                        <input type="file" accept="application/pdf" class="input-catalogo-pdf" id="catalogoPdf">
                    </label>
                </div>
        
        
                ${!urlCatalogo ? '<span style="color:#888">No hay catálogo subido</span>' : ''}
                <div class="info-sistema">
                    <i class='bx bx-info-circle'></i>
                    <div class="detalle-info">
                        <p>Solo puede haber uno, al subir uno nuevo se reemplaza el anterior.</p>
                    </div>
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarScreen2();
    
        function inicializarCargaPDF({ dropZoneId, inputId, labelTextId }) {
            const dropZone = document.getElementById(dropZoneId);
            const fileInput = document.getElementById(inputId);
            const uploadText = document.getElementById(labelTextId);
    
            if (!dropZone || !fileInput || !uploadText) {
                console.warn('Elementos no encontrados para inicializar carga PDF');
                return;
            }
    
            // Evitar comportamiento por defecto
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, e => e.preventDefault());
            });
    
            dropZone.addEventListener('dragover', () => {
                dropZone.classList.add('dragover');
            });
    
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
    
            dropZone.addEventListener('drop', (e) => {
                dropZone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
    
                if (file && file.type === "application/pdf") {
                    fileInput.files = e.dataTransfer.files;
                    uploadText.textContent = `Archivo: ${file.name}`;
                } else {
                    uploadText.textContent = "Solo se permiten archivos PDF";
                }
            });
    
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    uploadText.textContent = `Archivo: ${file.name}`;
                }
            });
        }
    
        // Llamada de ejemplo (cuando se cargue la página)
    
        inicializarCargaPDF({
            dropZoneId: 'drop-zone',
            inputId: 'catalogoPdf',
            labelTextId: 'upload-text'
        });
    
    
        // Agregar eventos después de mostrar el modal
        const input = contenido.querySelector('.input-catalogo-pdf');
        const btnSubir = contenido.querySelector('.subir-catalogo');
        const btnVer = contenido.querySelector('.ver-catalogo');
        let archivo = null;
    
        if (input) {
            input.addEventListener('change', e => {
                archivo = e.target.files[0];
            });
        }
    
        if (btnSubir) {
            btnSubir.addEventListener('click', confirmarSubidaCatalogo);
        }
    
        if (btnVer && urlCatalogo) {
            btnVer.addEventListener('click', () => {
                // Cambiar la URL para visualización directa en lugar de descarga
                const urlVisualizacion = urlCatalogo.replace('&export=download', '&export=view');
                window.open(urlVisualizacion, '_blank');
            });
        }
    
        async function confirmarSubidaCatalogo() {
            if (!archivo) {
                mostrarNotificacion('Selecciona un archivo PDF');
                return;
            }
    
            try {
                mostrarCarga();
                const formData = new FormData();
                formData.append('catalogo', archivo);
    
                const res = await fetch('/subir-catalogo', {
                    method: 'POST',
                    body: formData
                });
    
                if (!res.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
    
                const data = await res.json();
    
                if (data.success) {
                    mostrarNotificacion('Catalago actualizado',{tipo:'exito', duracion:2000})
                    ocultarScreen();
                } else {
                    mostrarNotificacion('Error al actulizar el catalogo',{tipo:'error'})
                    throw new Error(data.error || 'Error al subir catálogo');
                }
            } catch (error) {
                mostrarNotificacion('Error al actulizar el catalogo',{tipo:'error'})
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        }
    }

    aplicarFiltros();
}