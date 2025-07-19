let movimientosAcopio = [];
const DB_NAME = 'damabrava_db';
const REGISTROS_ACOPIO = 'registros_acopio';


async function obtenerMovimientosAcopio() {
    try {

        const registrosAcopioCache = await obtenerLocal(REGISTROS_ACOPIO, DB_NAME);

        if (registrosAcopioCache.length > 0) {
            movimientosAcopio = registrosAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actualizando desde el cache productos')
        }

        const response = await fetch('/obtener-movimientos-acopio');
        const data = await response.json();

        if (data.success) {
            movimientosAcopio = data.movimientos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });;

            if (JSON.stringify(registrosAcopioCache) !== JSON.stringify(movimientosAcopio)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(REGISTROS_ACOPIO, DB_NAME);
                        const tx = db.transaction(REGISTROS_ACOPIO, 'readwrite');
                        const store = tx.objectStore(REGISTROS_ACOPIO);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of movimientosAcopio) {
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
        console.error('Error al obtener movimientos:', error);
        return false;
    }
}


export async function mostrarRegistrosAcopio() {

    renderInitialHTML();

    const [obtnerRegistros] = await Promise.all([
        await obtenerMovimientosAcopio(),
    ]);
}
function renderInitialHTML() {

    const view = document.querySelector('.registros-acopio-cont');
    const initialHTML = `  
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Registros acopio</p>
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
                <button class="btn-filtro">Bruto</button>
                <button class="btn-filtro">Prima</button>
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
    const productosContainer = document.querySelector('.registros-acopio-cont .contenido-view');
    const productosHTML = movimientosAcopio.map(registro => `
        <div class="item-view" data-id="${registro.id}">
            <div class="header-view">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${registro.id}</span><span class="flotante-view ${registro.tipo.includes('Ingreso') ? 'green' : 'red'}">${registro.tipo}</span></span>
                    <span class="detalle">${registro.nombreMovimiento}</span>
                    <span class="pie">${registro.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosRegistrosAcopio();
}


function eventosRegistrosAcopio() {
    const botonesTipo = document.querySelectorAll('.filtros-view.tipo .btn-filtro');

    const items = document.querySelectorAll('.item-view');

    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');
    const btnLimpiar = document.querySelector('.limpiar-search');


    let filtroNombreActual = 'todos';
    let filtroMateriaActual = null;
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
            const tipoFiltro2 = boton.textContent.trim().toLowerCase();
            filtroNombreActual = tipoFiltro2 === 'todos' ? 'todos' :
                tipoFiltro2 === 'ingresos' ? 'ingreso' : tipoFiltro2 === 'anulados' ? 'anulado' : 'salida';
            aplicarFiltros();
        }
        boton.addEventListener('click', async () => {
            const tipoFiltro = boton.textContent.trim().toLowerCase();

            // Manejar botones de tipo de movimiento (todos, ingresos, salidas)
            if (['todos', 'ingresos', 'salidas', 'anulados'].includes(tipoFiltro)) {
                botonesTipo.forEach(b => {
                    if (['todos', 'ingresos', 'salidas', 'anulados'].includes(b.textContent.trim().toLowerCase())) {
                        b.classList.remove('activo');
                    }
                });
                boton.classList.add('activo');
                filtroNombreActual = tipoFiltro === 'todos' ? 'todos' :
                    tipoFiltro === 'ingresos' ? 'ingreso' : tipoFiltro === 'anulados' ? 'anulado' : 'salida';
            }
            // Manejar botones de tipo de materia (bruto, prima)
            else if (['bruto', 'prima'].includes(tipoFiltro)) {
                if (boton.classList.contains('activo')) {
                    boton.classList.remove('activo');
                    filtroMateriaActual = null;
                } else {
                    // Desactivar el otro botón de materia si está activo
                    botonesTipo.forEach(b => {
                        if (['bruto', 'prima'].includes(b.textContent.trim().toLowerCase())) {
                            b.classList.remove('activo');
                        }
                    });
                    boton.classList.add('activo');
                    filtroMateriaActual = tipoFiltro;
                }
            }

            aplicarFiltros();
            await scrollToCenter(boton, boton.parentElement);
        });
    });

    function aplicarFiltros() {
        const filtroTipo = filtroNombreActual;
        const filtroMateria = filtroMateriaActual;
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);

        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = movimientosAcopio.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Aplicar filtro de tipo de movimiento
            if (filtroTipo !== 'todos') {
                const tipoCompleto = registroData.tipo.toLowerCase();
                const [tipoMovimiento] = tipoCompleto.split(' ');
                mostrar = tipoMovimiento === filtroTipo;
            }

            // Aplicar filtro de tipo de materia
            if (mostrar && filtroMateria) {
                const tipoCompleto = registroData.tipo.toLowerCase();
                const [, tipoMateria] = tipoCompleto.split(' ');
                mostrar = tipoMateria === filtroMateria;
            }

            // Filtro de fechas
            if (mostrar && fechasSeleccionadas.length === 2) {
                const [fechaPart] = registroData.fecha.split(','); // Dividir por coma primero
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
                    registroData.nombreMovimiento,
                    registroData.tipo,
                    registroData.fecha,
                    registroData.producto,
                    registroData.observaciones
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
    btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.focus();
        toggleLimpiarBtn();
        aplicarFiltros();
    });


    window.info = function (registroId) {
        const registro = movimientosAcopio.find(r => r.id === registroId);
        if (!registro) return;

        // Separar fecha y hora
        const [fecha, hora] = registro.fecha.split(',').map(item => item.trim());

        // Preparar la sección de características
        const caracteristicasHTML = registro.caracteristicas && registro.caracteristicas.trim() ? `
            <p class="subtitulo">Características del producto</p>
            <div class="campo-vertical">
                ${registro.caracteristicas.split(';').map(caracteristica => {
            const [nombre, valor] = caracteristica.split(':').map(item => item.trim());
            return `<div class="detalle-campo"><span><i class='bx bx-check-circle'></i> ${nombre}: </span>${valor}</div>`;
        }).join('')}
            </div>
        ` : '';

        // Check if it's the last ingreso record
        const esIngreso = registro.tipo.toLowerCase().startsWith('ingreso');
        const esUltimoIngreso = esIngreso ?
            movimientosAcopio
                .filter(r => r.tipo.toLowerCase().startsWith('ingreso') &&
                    r.idProducto === registro.idProducto &&
                    r.tipo === registro.tipo)
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                })[0]?.id === registro.id
            : false;

        const esSalida = registro.tipo.toLowerCase().startsWith('salida');

        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Información</p>
                    </div>
                    <div class="botones-container">
                        ${tienePermiso('eliminacion') && registro.tipo === 'Anulado' ? `<button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i></button>` : ''}
                        ${((esSalida || esUltimoIngreso) && tienePermiso('anulacion')) ?
                    `<button class="btn-anular btn orange" data-id="${registro.id}"><i class="bx bx-x-circle"></i>Anular</button>`
                    : ''}
                    </div>
                </div>
            </div>
            
            <div class="contenido">
                <p class="subtitulo">Información básica</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span>${registro.nombreMovimiento}</div>
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${fecha}</div>
                    <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora: </span>${hora}</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Tipo: </span>${registro.tipo}</div>
                </div>
    
                <p class="subtitulo">Detalles del producto</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-barcode'></i> ID Producto: </span>${registro.idProducto}</div>
                    <div class="detalle-campo"><span><i class='bx bx-box'></i> Producto: </span>${registro.producto}</div>
                    <div class="detalle-campo"><span><i class='bx bx-weight'></i> Peso: </span>${registro.peso} Kg.</div>
                </div>
    
                <p class="subtitulo">Detalles del movimiento</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-user'></i> Operario: </span>${registro.operario}</div>
                    <div class="detalle-campo"><span><i class='bx bx-notepad'></i> Nombre del movimiento: </span>${registro.nombreMovimiento}</div>
                </div>
    
                ${caracteristicasHTML}
    
                <p class="subtitulo">Observaciones</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones: </span>${registro.observaciones || 'Ninguna'}</div>
                </div>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        if (tienePermiso('anulacion') && (esSalida || esUltimoIngreso)) {
            const btnAnular = contenido.querySelector('.btn-anular');
            btnAnular.addEventListener('click', () => anular(registro));
        }
        if (tienePermiso('eliminacion') && registro.tipo === 'Anulado') {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }

        async function eliminar(registro) {
            const contenido = document.querySelector('.screen2');
            const [fecha, hora] = registro.fecha.split(',').map(item => item.trim());

            const registrationHTML = `
                    <div class="top-view">
                        <div class="encabezado">
                            <div class="titulo-back">
                                <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                                <p class="titulo">Eliminar registros</p>
                            </div>
                            <div class="botones-container">
                                <button class="btn-confirmar-eliminar btn red"><i class='bx bx-trash'></i> Eliminar</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="contenido">
                        <p class="subtitulo">Información del registro</p>
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                            <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span>${registro.nombreMovimiento}</div>
                            <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${fecha}</div>
                            <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora: </span>${hora}</div>
                            <div class="detalle-campo"><span><i class='bx bx-package'></i> Tipo: </span>${registro.tipo}</div>
                        </div>
                        <p class="subtitulo">Información del producto</p>
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-box'></i> Producto: </span>${registro.producto}</div>
                            <div class="detalle-campo"><span><i class='bx bx-weight'></i> Peso: </span>${registro.peso} Kg.</div>
                        </div>

                        <p class="subtitulo">Motivo de la eliminación</p>
                        <div class="entrada">
                            <i class='bx bx-comment-detail'></i>
                            <div class="input">
                                <p class="detalle">Motivo</p>
                                <input class="motivo-eliminacion" type="text" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="info-sistema">
                            <i class='bx bx-info-circle'></i>
                            <div class="detalle-info">
                                <p>Vas a eliminar un registro del sistema. Esta acción no se puede deshacer y podría afectar a otros registros relacionados ademas de que no se te regresara ningun peso o lote de este registro. Asegúrate de que deseas continuar.</p>
                            </div>
                        </div>
                    </div>
                `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            // Agregar evento al botón de confirmar eliminación
            const btnConfirmarEliminar = contenido.querySelector('.btn-confirmar-eliminar');
            btnConfirmarEliminar.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-eliminacion').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la eliminación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/eliminar-movimiento-acopio/${registro.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerMovimientosAcopio();
                        ocultarScreen();
                        updateHTMLWithData();
                        mostrarNotificacion('Se elimino el registro', { tipo: 'exito', duracion: 2000 })
                    } else {
                        mostrarNotificacion('Error al eliminar el registro', { tipo: 'error' })
                        throw new Error(data.error);
                    }
                } catch (error) {
                    mostrarNotificacion('Error al eliminar el registro', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function anular(registro) {
            const contenido = document.querySelector('.screen2');
            const [fecha, hora] = registro.fecha.split(',').map(item => item.trim());

            const registrationHTML = `
                    <div class="top-view">
                        <div class="encabezado">
                            <div class="titulo-back">
                                <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                                <p class="titulo">Anular registro</p>
                            </div>
                            <div class="botones-container">
                                <button class="btn-confirmar-anular btn red"><i class='bx bx-x-circle'></i> Anular</button>
                            </div>
                        </div>
                    </div>
                    <div class="contenido">
                        <p class="subtitulo">Información del registro</p>
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                            <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span>${registro.nombreMovimiento}</div>
                            <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${fecha}</div>
                            <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora: </span>${hora}</div>
                            <div class="detalle-campo"><span><i class='bx bx-package'></i> Tipo: </span>${registro.tipo}</div>
                        </div>
                        <p class="subtitulo">Información del producto</p>
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-box'></i> Producto: </span>${registro.producto}</div>
                            <div class="detalle-campo"><span><i class='bx bx-weight'></i> Peso: </span>${registro.peso} Kg.</div>
                        </div>

                        <p class="subtitulo">Motivo de la anulación</p>
                        <div class="entrada">
                            <i class='bx bx-comment-detail'></i>
                            <div class="input">
                                <p class="detalle">Motivo</p>
                                <input class="motivo-anulacion" type="text" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="info-sistema">
                            <i class='bx bx-info-circle'></i>
                            <div class="detalle-info">
                                <p>Estás por anular un registro del sistema. Esta acción mantendrá el registro pero lo marcará como anulado, además te devolverá el peso en caso de (Salida) y quitará el lote en caso de (Ingreso).</p>
                            </div>
                        </div>

                    </div>
                `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            const btnConfirmarAnular = contenido.querySelector('.btn-confirmar-anular');
            btnConfirmarAnular.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-anulacion').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la anulación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/anular-movimiento-acopio/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerMovimientosAcopio();
                        info(registroId);
                        updateHTMLWithData();
                        mostrarNotificacion('Se anulo el registro', { tipo: 'exito', duracion: 2000 })
                    } else {
                        mostrarNotificacion('Error al anular registro', { tipo: 'error' })
                        throw new Error(data.error);
                    }
                } catch (error) {
                    mostrarNotificacion('Error al anular registro', { tipo: 'error' })
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
    }
    aplicarFiltros();
}