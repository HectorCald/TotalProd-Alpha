let productos = [];
let etiquetasAcopio = [];

const DB_NAME = 'damabrava_db';
const PRODUCTOS_AC_DB = 'productos_acopio';
const ETIQUETAS_AC_DB = 'etiquetas_acopio';

let tipoEvento = [];

let carritoPedidos = new Map(JSON.parse(localStorage.getItem('damabrava_carrito_pedidos') || '[]'));

let carritoSalidasAcopio = new Map(JSON.parse(localStorage.getItem('damabrava_salida_acopio') || '[]'));
let carritoIngresosAcopio = new Map(JSON.parse(localStorage.getItem('damabrava_ingreso_acopio') || '[]'));
let mensajeIngresos = localStorage.getItem('damabrava_mensaje_ingresos') || 'Se ingreso:\n• Sin ingresos registrados';

async function obtenerEtiquetasAcopio() {
    try {

        const etiquetasAcopioCache = await obtenerLocal(ETIQUETAS_AC_DB, DB_NAME);

        if (etiquetasAcopioCache.length > 0) {
            etiquetasAcopio = etiquetasAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actualizando desde el cache etiquetas')
            updateHTMLWithData();
        }


        const response = await fetch('/obtener-etiquetas-acopio');
        const data = await response.json();

        if (data.success) {
            etiquetasAcopio = data.etiquetas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(etiquetasAcopioCache) !== JSON.stringify(etiquetasAcopio)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(ETIQUETAS_AC_DB, DB_NAME);
                        const tx = db.transaction(ETIQUETAS_AC_DB, 'readwrite');
                        const store = tx.objectStore(ETIQUETAS_AC_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of etiquetasAcopio) {
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
        }
        else {
            console.log('no son diferentes')
        }
        return true;

    } catch (error) {
        console.error('Error al obtener etiquetas:', error);
        return false;
    }
}
async function obtenerAlmacenAcopio() {
    try {

        const productosAcopioCache = await obtenerLocal(PRODUCTOS_AC_DB, DB_NAME);

        if (productosAcopioCache.length > 0) {
            productos = productosAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actualizando desde el cache productos')
        }
        const response = await fetch('/obtener-productos-acopio');
        const data = await response.json();

        if (data.success) {
            productos = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(productosAcopioCache) !== JSON.stringify(productos)) {
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
            return false;
        }


    } catch (error) {
        console.error('Error al obtener los pagos:', error);
        return false;
    }
}


let productoPedido = '';
let pedidoId = '';
export async function mostrarAlmacenAcopio(producto = '', pedido = '') {
    productoPedido = producto;
    pedidoId = pedido;
    tipoEvento = localStorage.getItem('tipoEventoLocal') || 'almacen';
    renderInitialHTML(); // Render initial HTML immediately
    const [almacenGeneral, etiquetasResult] = await Promise.all([
        obtenerEtiquetasAcopio(),
        await obtenerAlmacenAcopio(),
    ]);
}
function renderInitialHTML() {

    const view = document.querySelector('.almacen-acopio-cont');
    const initialHTML = `
            <div class=top-view>
                <div class="encabezado">
                    <div class="titulo-back">
                        <p class="titulo">Almacen acopio</p>
                    </div>
                    <div class="botones-container">
                        ${tipoEvento === 'almacen' && tienePermiso('creacion')? `
                        <button class="btn-etiquetas btn blue"><i class='bx bx-purchase-tag'></i></button>
                        <button class="btn-crear-producto btn orange"> <i class='bx bx-plus'></i></button>
                        ` : ''}
                        ${tipoEvento === 'orden' ? `
                            <button class="btn orange mensaje-pedidos"><i class='bx bx-comment-detail'></i></button>
                            <button class="btn-flotante-pedidos btn blue" style="position:relative"><i class='bx bx-cart'></i></button>
                            ` : ''}
                        ${tipoEvento === 'ingresos' ? `
                            <button class="btn orange mensaje-ingresos"><i class='bx bx-comment-detail'></i></button>`
            : ''}
                    </div>
                </div>
                <div class="buscador-view">
                    <button class="lupa"><i class='bx bx-search'></i></button>
                    <input type="text" class="search" placeholder="Buscar...">
                    <button class="limpiar-search" style="right:0px"><i class='bx bx-x'></i></button>
                </div>
                
                <div class="filtros-view etiquetas-filter">
                    <button class="btn-filtro todos activo">Todos</button>
                    ${Array(5).fill().map(() => `
                        <div class="skeleton skeleton-etiqueta"></div>
                    `).join('')}
                </div>
                <div class="filtros-view cantidad-filter">
                    <button class="btn-filtro" title="Mayor a menor"><i class='bx bx-sort-down'></i></button>
                    <button class="btn-filtro" title="Menor a mayor"><i class='bx bx-sort-up'></i></button>
                    <button class="btn-filtro"><i class='bx bx-sort-a-z'></i></button>
                    <button class="btn-filtro"><i class='bx bx-sort-z-a'></i></button>
                    <button class="btn-filtro activo" title="Bruto">Bruto</button>
                    <button class="btn-filtro" title="Prima">Prima</button>
                    <select name="tipoEventos" id="eventoTipo" class="tipo">
                        <option value="almacen">Almacen</option>
                        <option value="orden">Pedido</option>
                        <option value="salidas">Salida</option>
                        <option value="ingresos">Ingreso</option>
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
            `;
    view.innerHTML = initialHTML;
}
function updateHTMLWithData() {
    const etiquetasFilter = document.querySelector('.etiquetas-filter');
    const skeletons = etiquetasFilter.querySelectorAll('.skeleton');
    skeletons.forEach(s => s.remove());

    const etiquetasExistentes = etiquetasFilter.querySelectorAll('.btn-filtro:not(.todos)');
    etiquetasExistentes.forEach(e => e.remove());

    const etiquetasHTML = etiquetasAcopio.map(etiqueta => `
    <button class="btn-filtro">${etiqueta.etiqueta}</button>
    `).join('');

    etiquetasFilter.insertAdjacentHTML('beforeend', etiquetasHTML);

    // Update productos
    const productosContainer = document.querySelector('.almacen-acopio-cont .contenido-view');

    const productosHTML = productos.map(producto => {
        // Calcular total bruto
        const totalBruto = producto.bruto.split(';')
            .filter(lote => lote.trim())
            .reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);


        const itemCarrito = carritoPedidos.get(producto.id);
        const cantidadEnCarrito = itemCarrito ? itemCarrito.cantidad : 0;
        const mostrarCantidad = cantidadEnCarrito > 0 ? '' : 'style="display:none"';

        return `
            <div class="item-view" data-id="${producto.id}">
                <div class="header-view">
                    <i class='bx bx-package'></i>
                    <div class="info-header">
                        <span class="id-flotante"><span class="id">${producto.id}</span><span style=display:flex;><span class="flotante-view orange stock">${totalBruto.toFixed(2)} Kg.</span><span class="carrito-cantidad" ${mostrarCantidad}>${cantidadEnCarrito > 0 ? cantidadEnCarrito : ''}</span></span></span>
                        <span class="detalle">${producto.producto}</span>
                        <span class="pie">${producto.etiquetas ? producto.etiquetas.split(';').join(' • ') : ''}</span>
                    </div>
                </div>
            </div>
            `;
    }).join('');

    productosContainer.innerHTML = productosHTML;
    eventosAlmacenAcopio()
}


function eventosAlmacenAcopio() {
    const botonesEtiquetas = document.querySelectorAll('.filtros-view.etiquetas-filter .btn-filtro');
    const botonesCantidad = document.querySelectorAll('.filtros-view.cantidad-filter .btn-filtro');
    const inputBusqueda = document.querySelector('.search');



    const items = document.querySelectorAll('.item-view');
    const btnLimpiar = document.querySelector('.limpiar-search');

    const select = document.getElementById('eventoTipo');

    select.value = tipoEvento;
    select.addEventListener('change', () => {
        localStorage.setItem('tipoEventoLocal', select.value);
        tipoEvento = select.value; // <-- ACTUALIZA la variable global
        renderInitialHTML();
        updateHTMLWithData();
    });





    let pesoMostrado = 'bruto';
    let filtroEtiqueta = localStorage.getItem('filtroEtiquetaAcopio') || 'Todos';

    botonesCantidad.forEach((boton, index) => {
        if (boton.classList.contains('activo')) {
            pesoMostrado = boton.textContent.trim();
            aplicarFiltros();
        }
        boton.addEventListener('click', () => {
            // Si es botón de peso (Bruto/Prima)
            if (index === 4 || index === 5) {
                // Desactivar solo los botones de peso
                botonesCantidad[4].classList.remove('activo');
                botonesCantidad[5].classList.remove('activo');
                boton.classList.add('activo');

                pesoMostrado = index === 4 ? 'bruto' : 'prima';
                actualizarPesoMostrado();
            } else {
                // Para botones de ordenamiento (0-3)
                const botonesOrdenamiento = Array.from(botonesCantidad).slice(0, 4);
                botonesOrdenamiento.forEach(b => b.classList.remove('activo'));
                boton.classList.add('activo');
            }

            aplicarFiltros();
        });
    });
    function actualizarPesoMostrado() {
        const registros = document.querySelectorAll('.item-view');
        registros.forEach(registro => {
            const producto = productos.find(p => p.id === registro.dataset.id);
            if (producto) {
                const total = pesoMostrado === 'bruto'
                    ? producto.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0)
                    : producto.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);

                const stockSpan = registro.querySelector('.flotante-view.stock');
                if (stockSpan) {
                    stockSpan.textContent = `${total.toFixed(2)} Kg.`;
                }
            }
        });
    }
    function toggleLimpiarBtn() {
        if (inputBusqueda.value.trim() !== '') {
            btnLimpiar.style.display = 'block';
        } else {
            btnLimpiar.style.display = 'none';
        }
    }


    botonesEtiquetas.forEach(boton => {
        boton.classList.remove('activo');
        if (boton.textContent.trim() === filtroEtiqueta) {
            boton.classList.add('activo');
        }
        boton.addEventListener('click', () => {
            botonesEtiquetas.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
            filtroEtiqueta = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
            localStorage.setItem('filtroEtiquetaAcopio', filtroEtiqueta);
        });
    });
    btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.focus();
        toggleLimpiarBtn();
        aplicarFiltros();
    });



    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });
    inputBusqueda.addEventListener('input', (e) => {
        toggleLimpiarBtn();
        aplicarFiltros();
    });

    function aplicarFiltros() {
        const busqueda = normalizarTexto(inputBusqueda.value);
        const botonCantidadActivo = document.querySelector('.filtros-view.cantidad-filter .btn-filtro.activo');

        // Primero, filtrar todos los registros
        const itemsFiltrados = Array.from(items).map(registro => {
            const itemData = productos.find(r => r.id === registro.dataset.id);
            if (!itemData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Filtro por tipo
            if (filtroEtiqueta && filtroEtiqueta !== 'Todos') {
                const etiquetas = itemData.etiquetas ? itemData.etiquetas.split(';') : [];
                mostrar = etiquetas.includes(filtroEtiqueta);
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
            const contenedor = document.querySelector('.almacen-acopio-cont .contenido-view');
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
                    const nombreA = a.querySelector('.detalle span')?.textContent.trim().toLowerCase() || '';
                    const nombreB = b.querySelector('.detalle span')?.textContent.trim().toLowerCase() || '';
                    return nombreA.localeCompare(nombreB);
                }
                if (index === 3) { // Z-A nombre
                    const nombreA = a.querySelector('.detalle span')?.textContent.trim().toLowerCase() || '';
                    const nombreB = b.querySelector('.detalle span')?.textContent.trim().toLowerCase() || '';
                    return nombreB.localeCompare(nombreA);
                }
                return 0;
            });

            // Reinsertar en el DOM en el nuevo orden
            itemsArray.forEach(item => contenedor.appendChild(item));
        }
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
        }, 100);
    }
    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    if (tipoEvento === 'almacen') {
        const btnCrearProducto = document.querySelectorAll('.btn-crear-producto');
        const btnEtiquetas = document.querySelectorAll('.btn-etiquetas');
        if (tienePermiso('creacion')) {
            btnCrearProducto.forEach(btn => {
                btn.addEventListener('click', crearProducto);
            })
            btnEtiquetas.forEach(btn => {
                btn.addEventListener('click', gestionarEtiquetas);
            })
        }
        items.forEach(item => {
            item.addEventListener('click', function () {
                const registroId = this.dataset.id;
                window.info(registroId);
            });
        });
        window.info = function (registroId) {
            const producto = productos.find(r => r.id === registroId);
            if (!producto) return;

            // Process multiple bruto lots
            const lotesFormateadosBruto = producto.bruto.split(';')
                .filter(lote => lote.trim())
                .map(lote => {
                    const [peso, numeroLote] = lote.split('-');
                    return `<div class="detalle-campo">
                        <span><i class='bx bx-package'></i> Lote ${numeroLote}: </span>${parseFloat(peso).toFixed(2)} Kg.
                    </div>`;
                })
                .join('');

            // Process multiple prima lots
            const lotesPrimaFormateados = producto.prima.split(';')
                .filter(lote => lote.trim())
                .map(lote => {
                    const [peso, numeroLote] = lote.split('-');
                    return `<div class="detalle-campo">
                        <span><i class='bx bx-package'></i> Lote ${numeroLote}: </span>${parseFloat(peso).toFixed(2)} Kg.
                    </div>`;
                })
                .join('');

            // Calculate totals
            const totalBruto = producto.bruto.split(';')
                .reduce((total, lote) => total + parseFloat(lote.split('-')[0]), 0);

            const totalPrima = producto.prima.split(';')
                .reduce((total, lote) => total + parseFloat(lote.split('-')[0]), 0);

            const etiquetasFormateadas = producto.etiquetas.split(';')
                .filter(etiqueta => etiqueta.trim())
                .map(etiqueta => `<div class="detalle-campo"><span><i class='bx bx-tag'></i> ${etiqueta}</span>`)
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
                    <p class="subtitulo">Información básica</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${producto.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-cube'></i> Producto: </span>${producto.producto}</div>
                    </div>
        
                    <p class="subtitulo">Peso Bruto</p>
                    <div class="campo-vertical">
                        ${lotesFormateadosBruto}
                        <div class="detalle-campo"><span><i class='bx bx-calculator'></i> Total Bruto: </span>${totalBruto.toFixed(2)} Kg.</div>
                    </div>
        
                    <p class="subtitulo">Peso Prima</p>
                    <div class="campo-vertical">
                        ${lotesPrimaFormateados}
                        <div class="detalle-campo"><span><i class='bx bx-calculator'></i> Total Prima: </span>${totalPrima.toFixed(2)} Kg.</div>
                    </div>
        
                    ${etiquetasFormateadas ? `
                    <p class="subtitulo"><Etiquetas</p>
                    <div class="campo-vertical">
                        ${etiquetasFormateadas}
                    </div>`: ''}
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

                // Process multiple bruto lots
                const lotesFormateadosBruto = producto.bruto.split(';')
                    .filter(lote => lote.trim())
                    .map(lote => {
                        const [peso, numeroLote] = lote.split('-');
                        return `<span class="valor">
                            <strong><i class='bx bx-package'></i> Lote ${numeroLote}: </strong>${parseFloat(peso).toFixed(2)} Kg.
                        </span>`;
                    })
                    .join('');

                // Process multiple prima lots
                const lotesPrimaFormateados = producto.prima.split(';')
                    .filter(lote => lote.trim())
                    .map(lote => {
                        const [peso, numeroLote] = lote.split('-');
                        return `<span class="valor">
                            <strong><i class='bx bx-package'></i> Lote ${numeroLote}: </strong>${parseFloat(peso).toFixed(2)} Kg.
                        </span>`;
                    })
                    .join('');

                // Calculate totals
                const totalBruto = producto.bruto.split(';')
                    .reduce((total, lote) => total + parseFloat(lote.split('-')[0]), 0);

                const totalPrima = producto.prima.split(';')
                    .reduce((total, lote) => total + parseFloat(lote.split('-')[0]), 0);

                const etiquetasFormateadas = producto.etiquetas.split(';')
                    .filter(etiqueta => etiqueta.trim())
                    .map(etiqueta => `<span class="valor"><strong><i class='bx bx-tag'></i> ${etiqueta}</span>`)
                    .join('');

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
                        <p class="subtitulo">Información básica</p>
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${producto.id}</div>
                            <div class="detalle-campo"><span><i class='bx bx-cube'></i> Producto: </span>${producto.producto}</div>
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
                                <p>Vas a eliminar un producto del sistema. Esta acción no se puede deshacer y podría afectar a varios registros relacionados. Asegúrate de que deseas continuar.</p>
                            </div>
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
                        const response = await fetch(`/eliminar-producto-acopio/${registroId}`, {
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
                            await obtenerAlmacenAcopio();
                            updateHTMLWithData();
                            cerrarAnuncioManual('anuncioSecond');
                            ocultarScreen();
                            mostrarNotificacion('Se elimino el producto', { tipo: 'exito', duracion: 2000 })
                        } else {
                            mostrarNotificacion('Error al eliminar el producto', { tipo: 'error' })
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

                // Process bruto lots
                const lotesBrutoHTML = producto.bruto.split(';')
                    .map((lote, index) => {
                        const [peso, numeroLote] = lote.split('-');
                        return `
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class='bx bx-package'></i>
                                <div class="input">
                                    <p class="detalle">Peso Bruto</p>
                                    <input class="peso-bruto" data-lote="${numeroLote}" type="number" value="${peso}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-hash'></i>
                                <div class="input">
                                    <p class="detalle">Lote</p>
                                    <input class="lote-bruto" data-old-lote="${numeroLote}" type="number" value="${numeroLote}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                    </div>`;
                    }).join('');

                // Process prima lots
                const lotesPrimaHTML = producto.prima.split(';')
                    .map((lote, index) => {
                        const [peso, numeroLote] = lote.split('-');
                        return `
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class='bx bx-package'></i>
                                <div class="input">
                                    <p class="detalle">Peso Prima</p>
                                    <input class="peso-prima" data-lote="${numeroLote}" type="number" value="${peso}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-hash'></i>
                                <div class="input">
                                    <p class="detalle">Lote</p>
                                    <input class="lote-prima" data-old-lote="${numeroLote}" type="number" value="${numeroLote}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                        </div>`;
                    }).join('');

                // Process current tags
                const etiquetasProducto = producto.etiquetas.split(';').filter(e => e.trim());
                const etiquetasHTML = etiquetasProducto.map(etiqueta => `
                <div class="etiqueta-item" data-valor="${etiqueta}">
                    <i class='bx bx-purchase-tag'></i>
                    <span>${etiqueta}</span>
                    <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                </div>
            `).join('');

                // Available tags (excluding selected ones)
                const etiquetasDisponibles = etiquetasAcopio
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
                    <p class="subtitulo">Información básica</p>
                    <div class="entrada">
                        <i class='bx bx-cube'></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" value="${producto.producto}" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
        
                    <p class="subtitulo">Peso Bruto</p>
                    ${lotesBrutoHTML}
        
                    <p class="subtitulo">Peso Prima</p>
                    ${lotesPrimaHTML}
        
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
                            <p>Estás por editar un registro del sistema. Asegúrate de realizar los cambios correctamente, ya que podrían modificar información relacionada con regsitros ya existentes.</p>
                        </div>
                    </div>
                </div>
            `;

                contenido.innerHTML = registrationHTML;
                mostrarScreen2();

                // Event handlers for tags
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

                // Add event to save button
                const btnEditarProducto = contenido.querySelector('.btn-editar-producto');
                btnEditarProducto.addEventListener('click', confirmarEdicionProducto);

                async function confirmarEdicionProducto() {
                    try {
                        const productoNombre = document.querySelector('.producto').value.trim();
                        const motivo = document.querySelector('.motivo').value.trim();

                        // Get bruto lots
                        const brutoLotes = Array.from(document.querySelectorAll('.peso-bruto'))
                            .map((input, index) => {
                                const lote = document.querySelectorAll('.lote-bruto')[index].value;
                                return `${input.value}-${lote}`;
                            }).join(';');

                        // Get prima lots
                        const primaLotes = Array.from(document.querySelectorAll('.peso-prima'))
                            .map((input, index) => {
                                const lote = document.querySelectorAll('.lote-prima')[index].value;
                                return `${input.value}-${lote}`;
                            }).join(';');

                        // Get selected tags
                        const etiquetasSeleccionadas = Array.from(document.querySelectorAll('.etiqueta-item'))
                            .map(item => item.dataset.valor)
                            .join(';');

                        if (!motivo) {
                            mostrarNotificacion('Ingresa el motivo de la edición')
                            return;
                        }
                        mostrarCarga();

                        const response = await fetch(`/editar-producto-acopio/${registroId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                producto: productoNombre,
                                bruto: brutoLotes,
                                prima: primaLotes,
                                etiquetas: etiquetasSeleccionadas,
                                motivo
                            })
                        });

                        const data = await response.json();

                        if (data.success) {
                            await obtenerAlmacenAcopio();
                            info(registroId)
                            updateHTMLWithData();
                            mostrarNotificacion('Se actualizo el producto', { tipo: 'exito', duracion: 2000 })
                        } else {
                            mostrarNotificacion('Error al actualizar el producto', { tipo: 'error' })
                            throw new Error(data.error || 'Error al actualizar el producto');
                        }
                    } catch (error) {
                        mostrarNotificacion('Error al actualizar el producto', { tipo: 'error' })
                        console.error('Error:', error);
                    } finally {
                        ocultarCarga();
                    }
                }
            }
        }
        function crearProducto() {
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
                    <p class="subtitulo">Información básica</p>
                    <div class="entrada">
                        <i class='bx bx-cube'></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
    
                    <p class="subtitulo">Peso Bruto</p>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Peso Bruto</p>
                                <input class="peso-bruto" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-hash'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote-bruto" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    </div>
    
                    <p class="subtitulo">Peso Prima</p>
                
                <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Peso Prima</p>
                                <input class="peso-prima" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-hash'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote-prima" type="number" autocomplete="off" placeholder=" " required>
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
                                ${etiquetasAcopio.map(etiqueta =>
                `<option value="${etiqueta.etiqueta}">${etiqueta.etiqueta}</option>`
            ).join('')}
                            </select>
                            <button type="button" class="btn-agregar-etiqueta"><i class='bx bx-plus'></i></button>
                        </div>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            // Event handlers for tags
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
                const producto = document.querySelector('.nuevo-producto .producto').value.trim();
                const pesoBruto = document.querySelector('.nuevo-producto .peso-bruto').value.trim();
                const loteBruto = document.querySelector('.nuevo-producto .lote-bruto').value.trim();
                const pesoPrima = document.querySelector('.nuevo-producto .peso-prima').value.trim();
                const lotePrima = document.querySelector('.nuevo-producto .lote-prima').value.trim();

                // Get selected tags
                const etiquetasSeleccionadas = Array.from(document.querySelectorAll('.etiquetas-actuales .etiqueta-item'))
                    .map(item => item.dataset.valor)
                    .join(';');

                if (!producto || !pesoBruto || !loteBruto || !pesoPrima || !lotePrima) {
                    mostrarNotificacion({
                        message: 'Por favor complete todos los campos obligatorios',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                try {
                    const signal = await mostrarProgreso('.pro-new');
                    const response = await fetch('/crear-producto-acopio', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            producto,
                            pesoBruto,
                            loteBruto,
                            pesoPrima,
                            lotePrima,
                            etiquetas: etiquetasSeleccionadas
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        const newFila = data.id;
                        await obtenerAlmacenAcopio();
                        info(newFila)
                        updateHTMLWithData();
                        mostrarNotificacion({
                            message: 'Producto creado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    } else {
                        throw new Error(data.error || 'Error al crear el producto');
                    }
                } catch (error) {
                    if (error.message === 'cancelled') {
                        console.log('Operación cancelada por el usuario');
                        return;
                    }
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al procesar la operación',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarProgreso('.pro-new');
                }
            }
        }
        function gestionarEtiquetas() {
            const contenido = document.querySelector('.screen');
            const etiquetasHTML = etiquetasAcopio.map(etiqueta => `
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
                            <p class="titulo">Gestionar etiquetas</p>
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
                        const response = await fetch('/agregar-etiqueta-acopio', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ etiqueta: nuevaEtiqueta })
                        });

                        if (!response.ok) throw new Error('Error al agregar etiqueta');

                        const data = await response.json();
                        if (data.success) {
                            await obtenerEtiquetasAcopio();
                            updateHTMLWithData();
                            gestionarEtiquetas();
                            document.querySelector('.nueva-etiqueta').value = '';
                            mostrarNotificacion('Se agrego la etiquta', { tipo: 'exito', duracion: 2000 })
                        }
                    } catch (error) {
                        console.error('Error:', error);
                    } finally {
                        ocultarCarga();
                    }
                }
            });

            etiquetasActuales.addEventListener('click', async (e) => {
                if (e.target.closest('.btn-quitar-etiqueta')) {
                    try {
                        const etiquetaItem = e.target.closest('.etiqueta-item');
                        const etiquetaId = etiquetaItem.dataset.id;

                        mostrarCarga();
                        const response = await fetch(`/eliminar-etiqueta-acopio/${etiquetaId}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) throw new Error('Error al eliminar etiqueta');

                        const data = await response.json();
                        if (data.success) {
                            await obtenerEtiquetasAcopio();
                            updateHTMLWithData();
                            gestionarEtiquetas();
                            mostrarNotificacion('Se elimino la etiqueta', { tipo: 'exito', duracion: 2000 })
                        }
                    } catch (error) {
                        console.error('Error:', error);
                    } finally {
                        ocultarCarga();
                    }
                }
            });
        }
    } else if (tipoEvento === 'orden') {
        const botonFlotante = document.querySelector('.btn-flotante-pedidos');
        const btnMensaje = document.querySelector('.mensaje-pedidos');
        actualizarBotonFlotante();
        botonFlotante.addEventListener('click', mostrarCarritoPedidos);
        btnMensaje.addEventListener('click', mostrarMensajePedido);

        items.forEach(item => {
            item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
        });

        function agregarAlCarrito(productoId) {
            const producto = productos.find(p => p.id === productoId);
            if (!producto) return;

            if (navigator.vibrate) {
                navigator.vibrate(100);
            }

            const item = document.querySelector(`.item-view[data-id="${productoId}"]`);
            if (item) {
                item.classList.add('agregado-al-carrito');
                setTimeout(() => {
                    item.classList.remove('agregado-al-carrito');
                }, 500);
            }

            if (carritoPedidos.has(productoId)) {
                const itemCarrito = carritoPedidos.get(productoId);
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
                carritoPedidos.set(productoId, {
                    ...producto,
                    cantidad: 1
                });
                if (item) {
                    const cantidadSpan = item.querySelector('.carrito-cantidad');
                    if (cantidadSpan) {
                        cantidadSpan.style.display = '';
                        cantidadSpan.textContent = '1';
                    }
                }
            }
            actualizarCarritoLocal();
            actualizarBotonFlotante();
            actualizarCarritoUI();
        }
        window.eliminarDelCarrito = (id) => {
            const itemToRemove = document.querySelector(`.carrito-item[data-id="${id}"]`);
            const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);

            if (headerItem) {
                const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                if (cantidadSpan) cantidadSpan.textContent = '';
            }

            if (itemToRemove) {
                itemToRemove.style.height = `${itemToRemove.offsetHeight}px`;
                itemToRemove.classList.add('eliminar-item');

                setTimeout(() => {
                    itemToRemove.style.height = '0';
                    itemToRemove.style.margin = '0';
                    itemToRemove.style.padding = '0';

                    setTimeout(() => {
                        actualizarCantidad(id, 0);
                        carritoPedidos.delete(id);
                        actualizarCarritoLocal();
                        actualizarBotonFlotante();
                        itemToRemove.remove();

                        if (navigator.vibrate) {
                            navigator.vibrate(50);
                        }

                        if (carritoPedidos.size === 0) {
                            ocultarScreen();
                            mostrarNotificacion('Carrito vacio')
                        }
                    }, 300);
                }, 0);
            }
        };
        function actualizarBotonFlotante() {
            const botonFlotante = document.querySelector('.btn-flotante-pedidos');
            if (!botonFlotante) return;

            botonFlotante.style.display = carritoPedidos.size > 0 ? 'flex' : 'none';
            if (carritoPedidos.size > 0) {
                btnLimpiar.style.right = '35px'
            }
            else {
                btnLimpiar.style.right = '0'
            }
            botonFlotante.innerHTML = `
                    <i class="bx bx-cart"></i>
                    <span class="cantidad">${carritoPedidos.size}</span>
                `;
        }
        function mostrarCarritoPedidos() {
            const contenido = document.querySelector('.screen');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Carrito de pedidos</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-procesar-pedido btn green" onclick="registrarPedido()"><i class='bx bx-check'></i>Pedir</button>
                            <button class="btn blue limpiar"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <div class="carrito-items">
                        ${Array.from(carritoPedidos.values()).map(item => `
                            <div class="carrito-item" data-id="${item.id}">
                                <div class="item-info">
                                    <h3>${item.producto}</h3>
                                    <div class="cantidad-control">
                                        <button class="btn-cantidad" style="color:var(--error)" onclick="ajustarCantidad('${item.id}', -1)">-</button>
                                        <input type="number" value="${item.cantidad}" min="1"
                                            onfocus="this.select()"
                                            onchange="actualizarCantidad('${item.id}', this.value)">
                                        <button class="btn-cantidad" style="color:var(--exito)" onclick="ajustarCantidad('${item.id}', 1)">+</button>
                                    </div>
                                </div>
                                <div class="subtotal-delete">
                                    <div class="info-valores">
                                        <select class="unidad">
                                            <option value="Bolsas">Bls.</option>
                                            <option value="Arrobas">@</option>
                                            <option value="Libras">Lbrs.</option>
                                            <option value="Cajas">Cjs.</option>
                                            <option value="Kilos">Kg.</option>
                                            <option value="Quintales">qq.</option>
                                            <option value="Unidades">Und.</option>
                                        </select>
                                        <input type="text" class="detalle" placeholder="Observaciones">
                                    </div>
                                    <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.id}')">
                                        <i class="bx bx-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            const botonLimpiar = contenido.querySelector('.limpiar');
            botonLimpiar.addEventListener('click', () => {
                carritoPedidos.forEach((item, id) => {
                    const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
                    if (headerItem) {
                        const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                        if (cantidadSpan) cantidadSpan.textContent = '';
                        actualizarCantidad(id, 0);
                    }
                });

                carritoPedidos.clear();
                actualizarCarritoLocal();
                actualizarBotonFlotante();
                ocultarScreen();
                mostrarNotificacion('Se limpio el carrito');
            });
        }
        window.ajustarCantidad = (id, delta) => {
            const item = carritoPedidos.get(id);
            if (!item) return;

            const nuevaCantidad = item.cantidad + delta;
            if (nuevaCantidad > 0) {
                item.cantidad = nuevaCantidad;
                const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
                if (headerItem) {
                    const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                    if (cantidadSpan) {
                        cantidadSpan.style.display = '';
                        cantidadSpan.textContent = nuevaCantidad;
                    }
                }
                actualizarCarritoLocal();
                actualizarCarritoUI();
            }
            else {
                const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
                const cantidadSpan = headerItem ? headerItem.querySelector('.carrito-cantidad') : null;
                if (cantidadSpan) {
                    cantidadSpan.style.display = 'none';
                    cantidadSpan.textContent = '';
                }
            }
        };
        window.actualizarCantidad = (id, valor) => {
            const item = carritoPedidos.get(id);
            if (!item) return;

            const cantidad = parseInt(valor);
            if (cantidad > 0) {
                console.log(cantidad)
                item.cantidad = cantidad;
                const headerCounter = document.querySelector(`.item-view[data-id="${id}"] .carrito-cantidad`);
                if (headerCounter) {
                    headerCounter.textContent = cantidad;
                    headerCounter.style.display = '';
                }
                actualizarCarritoLocal();
                actualizarCarritoUI();
            }
            else {
                const headerItem = document.querySelector(`.item-view[data-id="${id}"]`);
                const cantidadSpan = headerItem ? headerItem.querySelector('.carrito-cantidad') : null;
                if (cantidadSpan) {
                    cantidadSpan.style.display = 'none';
                    cantidadSpan.textContent = '';
                }
            }
        };
        function actualizarCarritoUI() {
            if (carritoPedidos.size === 0) {
                ocultarAnuncioSecond();
                document.querySelector('.btn-flotante-pedidos').style.display = 'none';
                return;
            }

            const items = document.querySelectorAll('.carrito-item');
            items.forEach(item => {
                const id = item.dataset.id;
                const producto = carritoPedidos.get(id);
                if (producto) {
                    const cantidadInput = item.querySelector('input[type="number"]');
                    cantidadInput.value = producto.cantidad;
                }
            });
        }
        function actualizarCarritoLocal() {
            localStorage.setItem('damabrava_carrito_pedidos', JSON.stringify(Array.from(carritoPedidos.entries())));
        }
        let mensajePedido = localStorage.getItem('damabrava_mensaje_pedido') || 'Pedido de materia prima:\n• Sin productos en el pedido';

        // Modificar la función registrarPedido
        async function registrarPedido() {
            try {
                if (carritoPedidos.size === 0) {
                    mostrarNotificacion('El carrito esta vacio');
                    return;
                }

                mostrarCarga();

                // Format products from cart
                const productosParaEnviar = Array.from(carritoPedidos.entries()).map(([id, item]) => {
                    const carritoItem = document.querySelector('.carrito-item[data-id="' + id + '"]');
                    if (!carritoItem) {
                        console.error('No se encontró el item del carrito:', id);
                        return null;
                    }

                    const observacionesInput = carritoItem.querySelector('.detalle');
                    const unidadSelect = carritoItem.querySelector('.unidad');

                    return {
                        id: item.id,
                        nombre: item.producto,
                        cantidad: `${item.cantidad} ${unidadSelect ? unidadSelect.value : 'Bolsas'}`,
                        observaciones: observacionesInput ? observacionesInput.value : ''
                    };
                }).filter(item => item !== null);

                if (productosParaEnviar.length === 0) {
                    mostrarNotificacion('No hay productos válidos para enviar');
                    return;
                }

                const response = await fetch('/registrar-pedido', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productos: productosParaEnviar
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Generar el texto del pedido
                    mensajePedido = 'Pedido de materia prima:\n\n' + productosParaEnviar
                        .map(item => `• ${item.nombre} - ${item.cantidad}${item.observaciones ? ` (${item.observaciones})` : ''}`)
                        .join('\n') +
                        '\n\nEl pedido ya se encuentra en la App de TotalProd.';


                    // Guardar el mensaje en localStorage
                    localStorage.setItem('damabrava_mensaje_pedido', mensajePedido);

                    // Clear cart
                    carritoPedidos.clear();
                    localStorage.setItem('damabrava_carrito_pedidos', '[]');
                    ocultarScreen();
                    updateHTMLWithData();
                    mostrarNotificacion('Pedido realizado', { tipo: 'exito', duracion: 2000 });
                    mostrarMensajePedido();
                } else {
                    throw new Error(data.error || 'Error al registrar el pedido');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        }

        function mostrarMensajePedido() {
            const contenido = document.querySelector('.screen');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Pedidos realizados</p>
                        </div>
                        <div class="botones-container">
                           <button class="btn blue" onclick="limpiarFormatoPedido()"><i class="bx bx-trash"></i></button>
                            <button class="btn green" onclick="compartirFormatoPedido()"><i class="fab fa-whatsapp"></i></button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <div class="formato-pedido">
                        <div contenteditable="true" style="min-height: fit-content; white-space: pre-wrap; font-family: Arial, sans-serif; text-align: left; padding: 15px;">${mensajePedido}</div>
                    </div>
                </div>
                `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();
        }
        window.mostrarMensajePedido = mostrarMensajePedido;
        window.mostrarFormatoPedido = function () {
            const anuncioSecond = document.querySelector('.anuncio-second .contenido');
            if (!anuncioSecond) return;
            mostrarMensajePedido();
        };
        window.limpiarFormatoPedido = function () {
            mensajePedido = 'Pedido de materia prima:\n• Sin productos en el pedido';
            localStorage.setItem('damabrava_mensaje_pedido', mensajePedido);
            const formatoDiv = document.querySelector('.formato-pedido div[contenteditable]');
            if (formatoDiv) {
                formatoDiv.innerHTML = mensajePedido;
            }
        };
        window.compartirFormatoPedido = async function () {
            const formatoDiv = document.querySelector('.formato-pedido div[contenteditable]');
            if (!formatoDiv) return;

            const texto = encodeURIComponent(formatoDiv.innerText);

            // Open WhatsApp web with the text pre-filled
            window.open(`https://wa.me/?text=${texto}`, '_blank');
        };
        window.registrarPedido = registrarPedido;
    } else if (tipoEvento === 'salidas') {
        items.forEach(item => {
            item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
        });

        function mostrarCarritoSalidasAcopio() {
            const contenido = document.querySelector('.screen');

            const [id, item] = Array.from(carritoSalidasAcopio.entries())[0];

            const obtenerLotesDisponibles = (tipo) => {
                const lotes = tipo === 'bruto' ?
                    item.bruto.split(';').filter(lote => lote.trim() !== '') :
                    item.prima.split(';').filter(lote => lote.trim() !== '');

                return lotes.map(lote => {
                    const [peso, numero] = lote.split('-');
                    return { peso: parseFloat(peso), numero: parseInt(numero) };
                });
            };

            const generarOpcionesLote = (tipo) => {
                const lotes = obtenerLotesDisponibles(tipo);
                return lotes.map(lote =>
                    `<option value="${lote.numero}" data-peso="${lote.peso}">
                            Lote ${lote.numero} - ${lote.peso} Kg
                        </option>`
                ).join('');
            };

            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Salida</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-procesar-ingreso btn green"><i class='bx bx-check'></i> Finalizar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Producto</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto</span><span>${item.producto}</span></div>
                    </div>
                    <p class="subtitulo">Detalles de salida</p>
                    <div class="entrada">
                        <i class='bx bx-leaf'></i>
                        <div class="input">
                            <p class="detalle">Tipo de materia</p>
                            <select class="tipo-materia">
                                <option value="bruto">Materia Bruta</option>
                                <option value="prima">Materia Prima</option>
                            </select>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-receipt'></i>
                        <div class="input">
                            <p class="detalle">Lote disponible</p>
                            <select class="numero-lote" required>
                                <option value=""></option>
                                ${generarOpcionesLote('bruto')}
                            </select>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class="ri-scales-line"></i>
                        <div class="input">
                            <p class="detalle">Peso disponible</p>
                            <input type="number" class="peso-kg" step="0.01" min="0">
                        </div>
                    </div>
                    <p class="subtitulo">Nombre del ingreso</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Nombre del movimeinto</p>
                            <input class="nombre-movimiento" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    
                    <p class="subtitulo">Razon/motivo/observaciones</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Razon o motivo del ingreso</p>
                            <input class="observaciones-salida" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            // Eventos para manejar los cambios
            const tipoMateriaSelect = contenido.querySelector('.tipo-materia');
            const numeroLoteSelect = contenido.querySelector('.numero-lote');
            const pesoInput = contenido.querySelector('.peso-kg');

            // Actualizar lotes cuando cambie el tipo de materia
            tipoMateriaSelect.addEventListener('change', (e) => {
                const tipo = e.target.value;
                numeroLoteSelect.innerHTML = `
                    <option value=""></option>
                    ${generarOpcionesLote(tipo)}
                `;
                pesoInput.value = ''; // Limpiar el peso cuando cambie el tipo
            });

            // Actualizar peso cuando se seleccione un lote
            numeroLoteSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                if (selectedOption.value) {
                    pesoInput.value = selectedOption.dataset.peso || '';
                    pesoInput.focus();
                } else {
                    pesoInput.value = '';
                }
            });

            // Inicializar con los lotes de materia bruta
            numeroLoteSelect.innerHTML = `
                <option value=""></option>
                ${generarOpcionesLote('bruto')}
            `;

            // Evento para procesar la salida
            const btnProcesar = anuncioSecond.querySelector('.btn-procesar-ingreso');
            btnProcesar.addEventListener('click', procesarSalida);
        }
        async function procesarSalida() {
            try {
                mostrarCarga();
                const [id, item] = Array.from(carritoIngresosAcopio.entries())[0];

                const tipoMateria = document.querySelector('.tipo-materia').value;
                const numeroLote = document.querySelector('.numero-lote').value;
                const pesoKg = parseFloat(document.querySelector('.peso-kg').value);
                const nombreMovimiento = document.querySelector('.nombre-movimiento').value;
                const razonSalida = document.querySelector('.observaciones-salida').value;

                if (!numeroLote || !pesoKg || !nombreMovimiento) {
                    throw new Error('Por favor complete todos los campos');
                }

                // Obtener los lotes actuales según el tipo de materia
                const lotes = tipoMateria === 'bruto' ?
                    item.bruto.split(';').filter(l => l && l !== '0-1') :
                    item.prima.split(';').filter(l => l && l !== '0-1');

                // Encontrar y actualizar el lote específico
                const lotesActualizados = lotes.map(lote => {
                    const [pesoLote, numLote] = lote.split('-');
                    if (parseInt(numLote) === parseInt(numeroLote)) {
                        const nuevoPeso = Math.max(0, parseFloat(pesoLote) - pesoKg);
                        return nuevoPeso > 0 ? `${nuevoPeso.toFixed(2)}-${numLote}` : null;
                    }
                    return lote;
                }).filter(Boolean);

                // Preparar el objeto de actualización
                const updateData = {};
                updateData[tipoMateria] = lotesActualizados.length > 0 ? lotesActualizados.join(';') : '0-1';

                // Actualizar el producto
                const updateResponse = await fetch(`/actualizar-producto-acopio-salida/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                if (!updateResponse.ok) throw new Error('Error al actualizar producto');

                const fecha = new Date().toLocaleString('es-ES', {
                    timeZone: 'America/La_Paz' // Puedes cambiar esto según tu país o ciudad
                });
                const movimientoResponse = await fetch('/registrar-movimiento-acopio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fecha_hora: fecha,
                        idProducto: id,
                        nombreProducto: item.producto,
                        peso: pesoKg,
                        tipo: `Salida ${tipoMateria}`,
                        nombreMovimiento: nombreMovimiento,
                        observaciones: razonSalida,
                        numeroLote: numeroLote
                    })
                });

                if (!movimientoResponse.ok) throw new Error('Error al registrar movimiento');
                await obtenerAlmacenAcopio();
                carritoIngresosAcopio.clear();
                localStorage.setItem('damabrava_ingreso_acopio', '[]');
                mostrarNotificacion('Se registro la salida', { tipo: 'exito', duracion: 2000 })
            } catch (error) {
                mostrarNotificacion('Error al registrar la salida', { tipo: 'error' })
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        }
        function agregarAlCarrito(productoId) {
            const producto = productos.find(p => p.id === productoId);
            if (!producto) return;

            carritoSalidasAcopio.clear();
            carritoSalidasAcopio.set(productoId, producto);

            mostrarCarritoSalidasAcopio();
        }

    } else if (tipoEvento === 'ingresos') {
        const btnMensaje = document.querySelector('.mensaje-ingresos');
        btnMensaje.addEventListener('click', mostrarMensajeIngresos);
        if (productoPedido) {
            agregarAlCarrito(productoPedido);
        }

        items.forEach(item => {
            item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
        });

        function agregarAlCarrito(productoId) {

            const producto = productos.find(p => p.id === productoId);
            if (!producto) return;

            // Limpiar carrito anterior si existe
            carritoIngresosAcopio.clear();

            // Agregar nuevo producto
            carritoIngresosAcopio.set(productoId, producto);

            // Mostrar formulario inmediatamente
            mostrarCarritoIngresosAcopio();
        }
        function mostrarCarritoIngresosAcopio() {
            const contenido = document.querySelector('.screen');

            const [id, item] = Array.from(carritoIngresosAcopio.entries())[0];

            const actualizarLoteSegunTipo = (tipo) => {
                const lotes = tipo === 'bruto' ?
                    item.bruto.split(';').map(lote => {
                        const [peso, numero] = lote.split('-');
                        return { peso: parseFloat(peso), numero: parseInt(numero) };
                    }) :
                    item.prima.split(';').map(lote => {
                        const [peso, numero] = lote.split('-');
                        return { peso: parseFloat(peso), numero: parseInt(numero) };
                    });

                const ultimoLote = lotes.length > 0 ? Math.max(...lotes.map(l => l.numero)) : 0;
                const inputLote = document.querySelector('.numero-lote');
                if (inputLote) {
                    inputLote.value = ultimoLote + 1;
                }
            };
            const lotesBruto = item.bruto.split(';').map(lote => {
                const [peso, numero] = lote.split('-');
                return { peso: parseFloat(peso), numero: parseInt(numero) };
            });
            const ultimoLote = lotesBruto.length > 0 ? Math.max(...lotesBruto.map(l => l.numero)) : 0;

            const registrationHTML = `

                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Ingreso</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-procesar-ingreso btn green"><i class='bx bx-check'></i> Finalizar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Producto</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto</span><span>${item.producto}</span></div>
                    </div>
                    
                    <p class="subtitulo">Detalles de ingreso</p>
                    <div class="entrada">
                        <i class='bx bx-leaf'></i>
                        <div class="input">
                            <p class="detalle">Tipo de materia</p>
                            <select class="tipo-materia">
                                <option value="bruto">Materia Bruta</option>
                                <option value="prima">Materia Prima</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class="ri-scales-line"></i>
                            <div class="input">
                                <p class="detalle">Peso (Kg.)</p>
                                <input type="number" class="peso-kg" step="0.01" min="0" required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-receipt'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input type="number" class="numero-lote" value="${ultimoLote + 1}" min="1">
                            </div>
                        </div>
                    </div>
                    <p class="subtitulo">Carcateristicas organolépticas</p>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-palette'></i>
                            <div class="input">
                                <p class="detalle">Color</p>
                                <select class="color" required>
                                    <option value=""></option>
                                    <option value="Malo">Malo</option>
                                    <option value="Bueno">Bueno</option>
                                </select>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-wind'></i>
                            <div class="input">
                                <p class="detalle">Olor</p>
                                <select class="olor" required>
                                    <option value=""></option>
                                    <option value="Malo">Malo</option>
                                    <option value="Bueno">Bueno</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-face'></i>
                            <div class="input">
                                <p class="detalle">Sabor</p>
                                <select class="sabor" required>
                                    <option value=""></option>
                                    <option value="Malo">Malo</option>
                                    <option value="Bueno">Bueno</option>
                                </select>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-shape-square'></i>
                            <div class="input">
                                <p class="detalle">Textura</p>
                                <select class="textura" required>
                                    <option value=""></option>
                                    <option value="Malo">Malo</option>
                                    <option value="Bueno">Bueno</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <p class="subtitulo">Nombre del ingreso</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Nombre del movimiento</p>
                            <input class="nombre-movimiento" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    
                    <p class="subtitulo">Razon/motivo/observaciones</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="observaciones-ingreso" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                </div>
                <div class="anuncio-botones">
                    
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();

            // Agregar evento para actualizar lote cuando cambie el tipo de materia
            const tipoMateriaSelect = contenido.querySelector('.tipo-materia');
            tipoMateriaSelect.addEventListener('change', (e) => {
                actualizarLoteSegunTipo(e.target.value);
            });

            // Inicializar con el tipo de materia actual
            actualizarLoteSegunTipo('bruto');

            // Evento para procesar el ingreso
            const btnProcesar = contenido.querySelector('.btn-procesar-ingreso');
            btnProcesar.addEventListener('click', procesarIngreso);

            async function procesarIngreso() {
                try {
                    mostrarCarga();
                    const [id, item] = Array.from(carritoIngresosAcopio.entries())[0];
                    const nombreMovimiento = document.querySelector('.nombre-movimiento').value;
                    const tipoMateria = document.querySelector('.tipo-materia').value;
                    const pesoKg = document.querySelector('.peso-kg').value;
                    const numeroLote = document.querySelector('.numero-lote').value;
                    const color = document.querySelector('.color').value;
                    const olor = document.querySelector('.olor').value;
                    const sabor = document.querySelector('.sabor').value;
                    const textura = document.querySelector('.textura').value;
                    const razonIngreso = document.querySelector('.observaciones-ingreso').value;

                    if (!pesoKg || !numeroLote || !color || !olor) {
                        throw new Error('Por favor complete todos los campos');
                    }

                    // Preparar datos para la actualización
                    const caracteristicas = `Olor:${olor}; Color:${color}; Sabor:${sabor}; Textura:${textura}`;
                    const fecha = new Date().toLocaleString('es-ES', {
                        timeZone: 'America/La_Paz' // Puedes cambiar esto según tu país o ciudad
                    });

                    const movimientoResponse = await fetch('/registrar-movimiento-acopio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fecha_hora: fecha,
                            idProducto: id,
                            nombreProducto: item.producto,
                            peso: pesoKg,
                            tipo: `Ingreso ${tipoMateria}`,
                            nombreMovimiento: nombreMovimiento,
                            caracteristicas: caracteristicas,
                            observaciones: razonIngreso || 'Sin observaciones',
                            pedidoId: pedido // ← Añadir esta línea
                        })
                    });


                    if (!movimientoResponse.ok) throw new Error('Error al registrar movimiento');

                    // Actualizar el producto en el almacén
                    const updateResponse = await fetch(`/actualizar-producto-acopio/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tipoMateria,
                            pesoKg,
                            numeroLote
                        })
                    });

                    if (!updateResponse.ok) throw new Error('Error al actualizar producto');

                    // Format message properly
                    if (mensajeIngresos === 'Se ingreso:\n• Sin ingresos registrados') {
                        mensajeIngresos = 'Se ingreso:\n';
                    }
                    mensajeIngresos = mensajeIngresos
                        .replace(/\n\nSe ingreso en la App de TotalProd.$/, '')
                        .replace(/\n$/, '');
                    mensajeIngresos += `\n• ${item.producto} - ${pesoKg} Kg.`;
                    mensajeIngresos += '\n\nSe ingreso en la App de TotalProd.';
                    mostrarNotificacion('Se registro el ingreso', { tipo: 'exito', duracion: 2000 })
                    localStorage.setItem('damabrava_mensaje_ingresos', mensajeIngresos);
                    carritoIngresosAcopio.clear();
                    localStorage.setItem('damabrava_ingreso_acopio', '[]');
                    if (productoPedido) {
                        await mostrarPedidos();
                        ocultarScreen();
                    }
                    else {
                        await obtenerAlmacenAcopio();
                        updateHTMLWithData();
                        ocultarScreen();
                    }
                } catch (error) {
                    if (error.message === 'cancelled') {
                        console.log('Operación cancelada por el usuario');
                        return;
                    }
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al procesar la operación',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarProgreso('.pro-ingreso')
                }
            }
        }


        function mostrarMensajeIngresos() {
            const contenido = document.querySelector('.screen');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Ingresos realizados</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn blue" onclick="limpiarFormatoIngresos()"><i class="bx bx-trash"></i></button>
                            <button class="btn green" onclick="compartirFormatoIngresos()"><i class="fab fa-whatsapp"></i></button>
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <div class="formato-pedido">
                        <div contenteditable="true" style="min-height: fit-content; white-space: pre-wrap; font-family: Arial, sans-serif; text-align: left; padding: 15px;">${mensajeIngresos}</div>
                    </div>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen();
        }
        window.limpiarFormatoIngresos = function () {
            mensajeIngresos = 'Se ingreso:\n• Sin ingresos registrados';
            localStorage.setItem('damabrava_mensaje_ingresos', mensajeIngresos);
            const formatoDiv = document.querySelector('.formato-pedido div[contenteditable]');
            if (formatoDiv) {
                formatoDiv.innerHTML = mensajeIngresos;
            }
        };
        window.compartirFormatoIngresos = async function () {
            const formatoDiv = document.querySelector('.formato-pedido div[contenteditable]');
            if (!formatoDiv) return;

            const texto = encodeURIComponent(formatoDiv.innerText);
            window.open(`https://wa.me/?text=${texto}`, '_blank');
        };
    }

    if (tipoEvento === 'almacen' || tipoEvento === 'salidas' || tipoEvento === 'ingresos') {
        // Oculta todos los spans de cantidad del carrito
        const cantidadSpan = document.querySelectorAll('.item-view .carrito-cantidad');
        cantidadSpan.forEach(item => {
            item.style.display = 'none';
        });
        // Oculta el botón flotante del carrito si existe
        const botonFlotante = document.querySelector('.btn-flotante-pedidos');
        if (botonFlotante) {
            botonFlotante.style.display = 'none';
        }
    }
    aplicarFiltros();
}