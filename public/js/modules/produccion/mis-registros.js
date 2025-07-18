let registrosProduccion = [];
let productosGlobal = [];

const DB_NAME = 'damabrava_db';
const MIS_REGISTROS_PRODUCCION_DB = 'mis_registros_produccion';
const PRODUCTO_ALM_DB = 'prductos_alm';


async function obtenerMisRegistros() {
    try {
        const registrosCache = await obtenerLocal(MIS_REGISTROS_PRODUCCION_DB, DB_NAME);
        // Si hay registros en caché, actualizar la UI inmediatamente
        if (registrosCache.length > 0) {
            registrosProduccion = registrosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
        }

        const response = await fetch('/obtener-mis-registros-produccion');
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
                    const db = await initDB(MIS_REGISTROS_PRODUCCION_DB, DB_NAME);
                    const tx = db.transaction(MIS_REGISTROS_PRODUCCION_DB, 'readwrite');
                    const store = tx.objectStore(MIS_REGISTROS_PRODUCCION_DB);

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


export async function mostrarMisRegistros() {
    renderInitialHTML();

    const [registrosProduccion, productos] = await Promise.all([
        await obtenerMisRegistros(),
        await obtenerProductos()
    ]);
}
function renderInitialHTML() {

    const view = document.querySelector('.mis-registros-produccion-cont');
    const initialHTML = `
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo" style="width:100%">Mis registro</p>
                </div>
                <div class="botones-container">
                    <button class="nuevo-registro btn blue"><i class='bx bx-plus'></i> Nuevo</button>
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
    // Update productos
    const productosContainer = document.querySelector('.mis-registros-produccion-cont .contenido-view');
    const productosHTML = registrosProduccion.map(registro => `
        <div class="item-view" data-id="${registro.id}">
            <div class="header-view">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${registro.id}</span><span class="flotante-view ${registro.fecha_verificacion && registro.observaciones === 'Sin observaciones' ? 'green' : registro.observaciones !== 'Sin observaciones' && registro.fecha_verificacion ? 'orange' : 'gray'}">${registro.fecha_verificacion && registro.observaciones === 'Sin observaciones' ? 'Verificado' : registro.observaciones !== 'Sin observaciones' && registro.fecha_verificacion ? 'Observado' : 'Pendiente'}</span></span>
                    <span class="detalle">${registro.producto} - ${registro.gramos}gr.</span>
                    <span class="pie">${registro.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');

    productosContainer.innerHTML = productosHTML;
    eventosMisRegistros();
}


function eventosMisRegistros() {
    const btnNueva = document.querySelectorAll('.nueva-produccion');
    const botonesEstado = document.querySelectorAll('.filtros-view.estado .btn-filtro');
    const items = document.querySelectorAll('.item-view');
    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');
    const btnLimpiar = document.querySelector('.limpiar-search');
    const btnNuevoRegistro = document.querySelector('.nuevo-registro');


    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });

    let filtroNombreActual = 'todos';
    let filtroFechaInstance = null;


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
    botonesEstado.forEach(boton => {
        if (boton.classList.contains('activo')) {
            filtroNombreActual = boton.textContent.trim().toLowerCase();
            aplicarFiltros();
        }
        boton.addEventListener('click', async () => {
            botonesEstado.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');

            const tipoFiltro = boton.textContent.trim().toLowerCase();

            if (tipoFiltro === 'pendientes') {
                filtroNombreActual = 'pendiente';
            }
            else if (tipoFiltro === 'verificados') {
                filtroNombreActual = 'verificado';
            }
            else if (tipoFiltro === 'todos') {
                filtroNombreActual = 'todos';
            }
            else if (tipoFiltro === 'observados') {
                filtroNombreActual = 'observado';
            }

            aplicarFiltros();
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

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = registrosProduccion.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Aplicar todos los filtros
            if (filtroTipo && filtroTipo !== 'todos') {
                if (filtroTipo === 'pendiente') {
                    mostrar = !registroData.fecha_verificacion;
                } else if (filtroTipo === 'verificado') {
                    mostrar = registroData.fecha_verificacion;
                } else if (filtroTipo === 'observado') {
                    mostrar = registroData.fecha_verificacion && registroData.observaciones !== 'Sin observaciones';
                }
            }

            if (mostrar && fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = registroData.fecha.split('/');
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];
                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }


            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.producto,
                    registroData.gramos?.toString(),
                    registroData.lote?.toString(),
                    registroData.fecha
                ].filter(Boolean).join(' ').toLowerCase();
                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

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
        }, 200);
    }
    function toggleLimpiarBtn() {
        if (inputBusqueda.value.trim() !== '') {
            btnLimpiar.style.display = 'block';
        } else {
            btnLimpiar.style.display = 'none';
        }
    }



    inputBusqueda.addEventListener('input', (e) => {
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('input', (e) => {
        toggleLimpiarBtn();
        aplicarFiltros();
    });


    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    btnNueva.forEach(btn => {
        btn.addEventListener('click', mostrarFormularioProduccion);
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
                        ${registro.fecha_verificacion && tienePermiso('anulacion') ? `<button class="btn-anular btn yellow" data-id="${registro.id}"><i class='bx bx-x-circle'></i></button>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información del producto</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</div>
                    <div class="detalle-campo"><strong><i class="ri-scales-line"></i> Gramaje: </strong>${registro.gramos}gr.</div>
                    <div class="detalle-campo"><strong><i class='bx bx-package'></i> Envases: </strong>${registro.envases_terminados} Und.</div>
                    <div class="detalle-campo"><strong><i class='bx bx-hash'></i> Vencimiento: </strong>${registro.fecha_vencimiento}</div>
                </div>

                <p class="subtitulo">Información básica</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><strong><i class='bx bx-user'></i> Operador: </strong>${registro.nombre}</div>
                    <div class="detalle-campo"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</div>
                </div>

                <p class="subtitulo">Detalles de producción</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><strong><i class='bx bx-receipt'></i> Lote: </strong>${registro.lote} Und.</div>
                    <div class="detalle-campo"><strong><i class='bx bx-cog'></i> Selección/Cernido: </strong>${registro.proceso}</div>
                    <div class="detalle-campo"><strong><i class='bx bx-bowl-hot'></i> Microondas: </strong>${registro.microondas}</div>
                    <div class="detalle-campo"><strong><i class='bx bx-check-shield'></i> Envases terminados: </strong>${registro.envases_terminados}</div>
                    <div class="detalle-campo"><strong><i class='bx bx-calendar'></i> Fecha de vencimiento: </strong>${registro.fecha_vencimiento}</div>
                </div>

                <p class="subtitulo">Detalles de verificación</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-transfer'></i> Verificado:</span> ${registro.fecha_verificacion ? `${registro.c_real} Und.` : 'Pendiente'}</div>
                    ${registro.fecha_verificacion ? `<div class="detalle-campo"><span><i class='bx bx-calendar-check'></i> Fecha verificación:</span> ${registro.fecha_verificacion}</div>` : ''}
                    ${registro.fecha_verificacion ? `<div class="detalle-campo"><span><i class='bx bx-box'></i> Cantidad</span> ${unidadesTira}</div>` : ''}
                    ${registro.fecha_verificacion ? `<div class="detalle-campo"><span><i class='bx bx-box'></i> Sueltos:</span> ${unidadesSueltas} und.</div>` : ''}
                    ${registro.observaciones ? `<div class="detalle-campo"><span><i class='bx bx-comment-detail'></i>Observaciones: </span> ${registro.observaciones}</div>` : ''}
                </div>
            </div>
        `;


        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        if (tienePermiso('anulacion') && registro.fecha_verificacion) {
            const btnAnular = contenido.querySelector('.btn-anular');
            btnAnular.addEventListener('click', () => anular(registro));
        }

        if (tienePermiso('edicion') && !registro.fecha_verificacion) {
            const btnEditar = contenido.querySelector('.btn-editar');
            btnEditar.addEventListener('click', () => editar(registro));
        }
        if (tienePermiso('eliminacion') && !registro.fecha_verificacion) {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(registro));
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
                const producto = document.querySelector('.editar-produccion .producto').value;
                const gramos = document.querySelector('.editar-produccion .gramaje').value;
                const lote = document.querySelector('.editar-produccion .lote').value;
                const proceso = document.querySelector('.editar-produccion .select').value;
                const microondas = document.querySelector('.editar-produccion .microondas').value;
                const envases_terminados = document.querySelector('.editar-produccion .terminados').value;
                const fecha_vencimiento = document.querySelector('.editar-produccion .vencimiento').value;
                const motivo = document.querySelector('.editar-produccion .motivo').value;
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
    }
    btnNuevoRegistro.addEventListener('click', () => {
        window.mostrarVistaCorrespondiente('formulario-produccion-cont');
        mostrarFormularioProduccion();
    });
    aplicarFiltros();
}