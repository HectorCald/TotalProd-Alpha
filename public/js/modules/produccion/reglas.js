let productosGlobal = [];
let reglasProduccion = [];
let reglasBase = [];
let preciosBase = {
    etiquetado: 0,
    envasado: 0,
    sellado: 0,
    cernido: 0
};
const DB_NAME = 'damabrava_db';
const PRODUCTO_ALM_DB = 'prductos_alm';
const REGLAS_BASE_DB = 'reglas_produccion_base';
const REGLAS_PRODUCCION_DB = 'reglas_produccion';


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
            console.log('Actulizando reglas base de cache')
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
                console.log('diferentes (reglas base)')
                updateHTMLWithData();

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

                    } catch (error) {
                        console.error('Error actualizando el caché de nombres:', error);
                    }
                })();
            }

            // Actualizar el caché en segundo plano

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
            console.log('Actulizando reglas de cache')
            updateHTMLWithData();
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
                console.log('Diferencias (reglas)');
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
async function obtenerProductos() {
    try {
        const productosCache = await obtenerLocal(PRODUCTO_ALM_DB, DB_NAME);

        if (productosCache.length > 0) {
            productosGlobal = productosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('Actulizando de cache productos')
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
                    console.log('Diferencias (productos)');
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

                            console.log('Caché de productos actualizado correctamente');
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


export async function mostrarReglas() {
    renderInitialHTML();

    const [reglas, reglasBase, productos] = await Promise.all([
        await obtenerReglas(),
        await obtenerReglasBase(),
        await obtenerProductos()
    ]);
}
function renderInitialHTML() {

    const view = document.querySelector('.reglas-cont');
    const initialHTML = `  
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo" style="width:100%">Reglas de precios</p>
                </div>
                <div class="botones-container">
                    <button class="nueva-regla btn blue"><i class='bx bx-plus'></i></button>
                    <button class="precios-base btn orange"><i class='bx bx-money'></i></button>
                </div>
            </div>
            <div class="buscador-view">
                <button class="lupa"><i class='bx bx-search'></i></button>
                <input type="text" class="search" placeholder="Buscar...">
                <button class="limpiar-search" style="right:-0px"><i class='bx bx-x'></i></button>
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
    // Update productos
    const productosContainer = document.querySelector('.reglas-cont .contenido-view');
    const productosHTML = reglasProduccion.map(regla => `
        <div class="item-view" data-id="${regla.id}">
            <div class="header-view">
                <i class='bx bx-book'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${regla.id}</span></span>
                    <span class="detalle">${regla.producto}</span>
                    <span class="pie">${regla.etiq != 1 ? 'Etiquetado: x' + regla.etiq : ''}${regla.sell != 1 ? ' - Sellado: x' + regla.sell : ''}${regla.envs != 1 ? ' - Envasado: x' + regla.envs : ''}${regla.cern != preciosBase.cernido ? ' - Cernido: ' + regla.cern : ''}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosReglas();
}


function eventosReglas() {
    const items = document.querySelectorAll('.item-view');
    const inputBusqueda = document.querySelector('.search');
    const nuevaRegla = document.querySelectorAll('.nueva-regla');
    const btnPreciosBase = document.querySelectorAll('.precios-base');
    const btnLimpiar = document.querySelector('.limpiar-search');

    function aplicarFiltros() {
        const busqueda = normalizarTexto(inputBusqueda.value);

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = reglasProduccion.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

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
    btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.focus();
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

    window.info = function (registroId) {

        const registro = reglasProduccion.find(r => r.id === registroId);
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
                        <button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i></button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información de la regla</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                    <div class="detalle-campo"><span><i class="ri-scales-line"></i> Producto: </span>${registro.producto}</div>
                </div>
                <p class="subtitulo">Reglas</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Etiquetado: </span>x${registro.etiq}</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Envasado: </span>x${registro.envs}</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Sellado: </span>x${registro.sell}</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Cernido: </span>${registro.cern}</div>
                    ${registro.grMax ? `<div class="detalle-campo"><span><i class='bx bx-package'></i> Gramaje maximo: </span>${registro.grMax} gr</div>` : ''}
                    ${registro.grMin ? `<div class="detalle-campo"><span><i class='bx bx-package'></i> Gramaje minimo: </span>${registro.grMin} gr</div>` : ''}
                </div>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        const btnEliminar = contenido.querySelector('.btn-eliminar');

        btnEliminar.addEventListener('click', () => eliminar(registro));
        function eliminar(registro) {

            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Eliminar regla</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-eliminar-registro btn red"><i class="bx bx-trash"></i> Eliminar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información de la regla</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                        <div class="detalle-campo"><span><i class="ri-scales-line"></i> Producto: </span>${registro.producto}</div>
                    </div>
                    <p class="subtitulo">Reglas</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Etiquetado: </span>x${registro.etiq}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Envasado: </span>x${registro.envs}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Sellado: </span>x${registro.sell}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Cernido: </span>${registro.cern}</div>
                        ${registro.grMax ? `<div class="detalle-campo"><span><i class='bx bx-package'></i> Gramaje maximo: </span>${registro.grMax} gr</div>` : ''}
                        ${registro.grMin ? `<div class="detalle-campo"><span><i class='bx bx-package'></i> Gramaje minimo: </span>${registro.grMin} gr</div>` : ''}
                    </div>
                    <p class="subtitulo">Motivo de la eliminación</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
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
                    const response = await fetch(`/eliminar-regla/${registroId}`, {
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
                        await obtenerReglas();
                        ocultarScreen();
                        updateHTMLWithData();
                        mostrarNotificacion('Se elimino la regla', { tipo: 'exito', duracion: 2000 })
                    } else {
                        mostrarNotificacion('Error al eliminar la regla', { tipo: 'error' })
                        throw new Error(data.error || 'Error al eliminar la regla');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al eliminar la regla', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }

    }

    nuevaRegla.forEach(btn => {
        btn.addEventListener('click', crearNuevaRegla);
    })
    btnPreciosBase.forEach(btn => {
        btn.addEventListener('click', verPreciosBase);
    })


    function crearNuevaRegla() {
        const contenido = document.querySelector('.screen');
        // Primero mostrar la selección del tipo de regla
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Nueva regla</p>
                    </div>
                </div>
            </div>

            <div class="contenido">
                <p class="subtitulo">Seleccione el tipo de regla</p>
                <div class="botones-seleccion campo-vertical" style="margin:0; gap:5px; padding:0; background:none; box-shadow:none;">
                    <button class="btn blue btn-por-producto">
                        <i class='bx bx-package'></i> Por Producto
                    </button>
                    <button class="btn orange btn-por-gramaje">
                        <i class='bx bx-line-chart'></i> Por Gramaje
                    </button>
                </div>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        // Agregar eventos a los botones
        contenido.querySelector('.btn-por-producto').addEventListener('click', mostrarFormularioProducto);
        contenido.querySelector('.btn-por-gramaje').addEventListener('click', mostrarFormularioGramaje);

        function mostrarFormularioProducto() {
            // Mantener el formulario existente para productos
            const formularioHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Regla(producto)</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-crear-regla btn orange"><i class="bx bx-plus"></i> Añadir</button>
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
                    <div class="sugerencias productos-list"></div>
                    ${mostrarCamposComunes()}
                </div>
            `;

            contenido.innerHTML = formularioHTML;
            configurarAutocompletado();
            configurarEventos('producto');            
        }

        function mostrarFormularioGramaje() {
            const formularioHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Regla(gramaje)</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-crear-regla btn orange"><i class="bx bx-plus"></i> Añadir</button>
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <p class="subtitulo">Información básica</p>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class="ri-scales-line"></i>
                            <div class="input">
                                <p class="detalle">Gr. Mínimo</p>
                                <input class="gr-minimo" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class="ri-scales-line"></i>
                            <div class="input">
                                <p class="detalle">Gr. Máximo</p>
                                <input class="gr-maximo" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                    ${mostrarCamposComunes()}
                    <div class="entrada">
                        <i class='bx bx-cube'></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="sugerencias productos-list"></div>
                </div>
            `;

            contenido.innerHTML = formularioHTML;
            configurarEventos('gramaje');
            configurarAutocompletado(); // <-- AGREGA ESTA LÍNEA AQUÍ
            configuracionesEntrada();
        }

        function mostrarCamposComunes() {
            return `
                <p class="subtitulo">Reglas de multiplicación</p>
                <div class="entrada">
                    <i class='bx bx-tag'></i>
                    <div class="input">
                        <p class="detalle">Etiquetado (x1 por defecto)</p>
                        <select class="multiplicador-etiquetado">
                            <option value="1" selected>x1</option>
                            <option value="2">x2</option>
                            <option value="3">x3</option>
                            <option value="4">x4</option>
                            <option value="5">x5</option>
                        </select>
                    </div>
                </div>
    
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Envasado (x1 por defecto)</p>
                        <select class="multiplicador-envasado">
                            <option value="1" selected>x1</option>
                            <option value="2">x2</option>
                            <option value="3">x3</option>
                            <option value="4">x4</option>
                            <option value="5">x5</option>
                        </select>
                    </div>
                </div>
    
                <div class="entrada">
                    <i class='bx bx-purchase-tag'></i>
                    <div class="input">
                        <p class="detalle">Sellado (x1 por defecto)</p>
                        <input 
                            class="multiplicador-sellado" 
                            type="number" 
                            value="1" 
                            step="0.001" 
                            min="0.001" 
                            placeholder=" "
                            lang="en"
                            inputmode="decimal"
                            pattern="[0-9]*[.,]?[0-9]*">
                    </div>
                </div>
    
                <div class="entrada">
                    <i class="ri-filter-line"></i>
                    <div class="input">
                        <p class="detalle">Cernido especial (1 por defecto)</p>
                        <input 
                            class="precio-cernido" 
                            type="number" 
                            value="${preciosBase.cernido}" 
                            step="0.001" 
                            min="0.001" 
                            placeholder=" "
                            lang="en"
                            inputmode="decimal"
                            pattern="[0-9]*[.,]?[0-9]*">
                    </div>
                </div>
            `;
        }

        function configurarAutocompletado() {
            const sugerenciasList = document.querySelectorAll('.productos-list');
            const productoInput = document.querySelectorAll('.entrada .producto');

            productoInput.forEach((input, index) => {
                input.addEventListener('input', (e) => {
                    const valor = normalizarTexto(e.target.value);
                    const lista = sugerenciasList[index]; // usar la lista correspondiente
                    lista.innerHTML = '';

                    if (valor) {
                        const sugerencias = productosGlobal.filter(p =>
                            normalizarTexto(p.producto).includes(valor)
                        ).slice(0, 5);

                        if (sugerencias.length) {
                            lista.style.display = 'flex';
                            sugerencias.forEach(p => {
                                const div = document.createElement('div');
                                div.classList.add('item');
                                div.textContent = `${p.producto} ${p.gramos}gr.`;
                                div.onclick = () => {
                                    input.value = p.producto;
                                    lista.style.display = 'none';
                                };
                                lista.appendChild(div);
                            });
                        } else {
                            lista.style.display = 'none';
                        }
                    } else {
                        lista.style.display = 'none';
                    }
                });

                // Opcional: ocultar sugerencias si pierde foco
                input.addEventListener('blur', () => {
                    setTimeout(() => {
                        sugerenciasList[index].style.display = 'none';
                    }, 200);
                });
            });
        }


        function configurarEventos(tipo) {
            const btnCrear = contenido.querySelector('.btn-crear-regla');


            btnCrear.addEventListener('click', () => confirmarCreacion(tipo));
            configuracionesEntrada();
        }

        async function confirmarCreacion(tipo) {
            try {
                mostrarCarga();
                let producto = '';
                let gramajeMin = null;
                let gramajeMax = null;

                if (tipo === 'producto') {
                    producto = document.querySelector('.producto').value.trim();
                    if (!producto) {
                        throw new Error('Por favor ingrese un nombre de producto');
                    }
                } else {
                    gramajeMin = document.querySelector('.gr-minimo').value;
                    gramajeMax = document.querySelector('.gr-maximo').value;
                    producto = document.querySelector('.producto').value.trim();
                    if (!gramajeMin || !gramajeMax) {
                        throw new Error('Por favor ingrese ambos rangos de gramaje');
                    }
                    if (parseInt(gramajeMin) > parseInt(gramajeMax)) {
                        throw new Error('El gramaje mínimo debe ser menor o igual que el máximo');
                    }
                    producto = `Regla ${gramajeMin}gr-${gramajeMax}gr(${producto})`;
                }

                const etiquetado = document.querySelector('.multiplicador-etiquetado').value;
                const envasado = document.querySelector('.multiplicador-envasado').value;
                const sellado = document.querySelector('.multiplicador-sellado').value.replace(',', '.');
                const cernido = document.querySelector('.precio-cernido').value.replace(',', '.');

                const response = await fetch('/agregar-reglas-multiples', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        producto,
                        reglas: {
                            etiquetado: Number(etiquetado),
                            envasado: Number(envasado),
                            sellado: Number(sellado),
                            cernido: Number(cernido)
                        },
                        gramajeMin: gramajeMin ? parseInt(gramajeMin) : null,
                        gramajeMax: gramajeMax ? parseInt(gramajeMax) : null
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error en la petición al servidor');
                }

                const result = await response.json();
                if (result.success) {
                    await obtenerReglas();
                    info(result.id);
                    updateHTMLWithData();
                    mostrarNotificacion({
                        message: 'Regla creada correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error(result.error || 'Error al guardar la regla');
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
                ocultarProgreso('.pro-registro');
            }
        }
    }
    async function verPreciosBase() {
        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Precios base</p>
                    </div>
                    <div class="botones-container">
                        <button class="btn-guardar-base btn orange"><i class="bx bx-save"></i> Guardar</button>
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información de precios base</p>
                <div class="entrada cernido-container">
                    <i class="ri-article-line"></i>
                    <div class="input">
                        <p class="detalle">Etiquetado</p>
                        <input class="etiquetado" type="number" value="${preciosBase.etiquetado}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada cernido-container">
                    <i class="ri-article-line"></i>
                    <div class="input">
                        <p class="detalle">Cernido</p>
                        <input class="cernido" type="number" value="${preciosBase.cernido}"  autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada cernido-container">
                    <i class="ri-article-line"></i>
                    <div class="input">
                        <p class="detalle">Envasado</p>
                        <input class="envasado" type="number" value="${preciosBase.envasado}"  autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada cernido-container">
                    <i class="ri-article-line"></i>
                    <div class="input">
                        <p class="detalle">Sellado</p>
                        <input class="sellado" type="number" value="${preciosBase.sellado}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <p class="subtitulo">Motivo de la modificación</p>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Motivo</p>
                        <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        const btnGuardar = contenido.querySelector('.btn-guardar-base');
        btnGuardar.addEventListener('click', confirmarCambios);

        async function confirmarCambios() {
            const etiquetado = document.querySelector('.etiquetado').value;
            const cernido = document.querySelector('.cernido').value;
            const envasado = document.querySelector('.envasado').value;
            const sellado = document.querySelector('.sellado').value;
            const motivo = document.querySelector('.motivo').value;

            if (!motivo) { // Solo el campo "Motivo" es obligatorio
                mostrarNotificacion('Ingresa el motivo del cambio')
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch(`/actualizar-precios-base`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        etiquetado: etiquetado,
                        envasado: envasado,
                        sellado: sellado,
                        cernido: cernido
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    await obtenerReglas();
                    updateHTMLWithData();
                    verPreciosBase();
                    mostrarNotificacion('Se actualizo el precio', {tipo: 'exito', duracion:2000})
                } else {
                    mostrarNotificacion('Error al actulizar precio base', {tipo: 'error'})
                    throw new Error(data.error || 'Error al actualizar los precios base');
                }
            } catch (error) {
                mostrarNotificacion('Error al actulizar precio base', {tipo: 'error'})
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        }
    }
    aplicarFiltros();
}