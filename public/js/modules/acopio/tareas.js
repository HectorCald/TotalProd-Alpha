import {usuarioInfo } from "../../dashboard.js";
let productosGlobal = [];
let tareasGlobal = [];
let listaTareasGlobal = [];


const DB_NAME = 'damabrava_db';
const TAREAS_DB = 'tareas_acopio';
const REGISTROS_TAREAS_DB = 'registros_tareas_acopio';
const PRODUCTOS_AC_DB = 'productos_acopio';


async function obtenerListaTareas() {
    try {

        const tareasCache = await obtenerLocal(TAREAS_DB, DB_NAME);

        if (tareasCache.length > 0) {
            listaTareasGlobal = tareasCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }


        const response = await fetch('/obtener-lista-tareas');
        const data = await response.json();

        if (data.success) {
            listaTareasGlobal = data.tareas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(listaTareasGlobal) !== JSON.stringify(tareasCache)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(TAREAS_DB, DB_NAME);
                        const tx = db.transaction(TAREAS_DB, 'readwrite');
                        const store = tx.objectStore(TAREAS_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of listaTareasGlobal) {
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
        console.error('Error al obtener lista de tareas:', error);
        return false;
    }
}
async function obtenerTareas() {
    try {
        const registrosTareasCache = await obtenerLocal(REGISTROS_TAREAS_DB, DB_NAME);

        if (registrosTareasCache.length > 0) {
            tareasGlobal = registrosTareasCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-tareas');
        const data = await response.json();

        if (data.success) {
            // Ordenar de más reciente a más antiguo por ID
            tareasGlobal = data.tareas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(registrosTareasCache) !== JSON.stringify(tareasGlobal)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(REGISTROS_TAREAS_DB, DB_NAME);
                        const tx = db.transaction(REGISTROS_TAREAS_DB, 'readwrite');
                        const store = tx.objectStore(REGISTROS_TAREAS_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of tareasGlobal) {
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
async function obtenerProductos() {
    try {
        const productosAcopioCache = await obtenerLocal(PRODUCTOS_AC_DB, DB_NAME);

        if (productosAcopioCache.length > 0) {
            productosGlobal = productosAcopioCache.sort((a, b) => {
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
            productosGlobal = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(productosAcopioCache) !== JSON.stringify(productosGlobal)) {
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
        console.error('Error al obtener los pagos:', error);
        return false;
    }
}


export async function mostrarTareas() {
    renderInitialHTML();

    const [productos, tareas, registros] = await Promise.all([
        obtenerProductos(),
        obtenerListaTareas(),
        await obtenerTareas(),
    ]);
}
function renderInitialHTML() {
    const view = document.querySelector('.tareas-acopio-cont');
    const initialHTML = `
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Tareas acopio</p>
                </div>
                <div class="botones-container">
                    <button class="nuevo-registro btn trans"><i class='bx bx-plus'></i></button>
                    <button class="btn-lista-tareas btn blue"><i class='bx bx-task'></i></button>
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
    function convertirHoraAMinutos(hora) {
        let [h, m] = hora.split(":").map(Number);
        return h * 60 + m;
    }

    function restarHoras(horaInicio, horaFin) {
        let inicioMin = convertirHoraAMinutos(horaInicio);
        let finMin = convertirHoraAMinutos(horaFin);
        let diff = finMin - inicioMin;

        // Convertimos de nuevo a HH:mm
        let horas = Math.floor(diff / 60);
        let minutos = diff % 60;
        return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }

    const productosContainer = document.querySelector('.tareas-acopio-cont .contenido-view');
    const productosHTML = tareasGlobal.map(registro => `
        <div class="item-view" data-id="${registro.id}">
            <div class="header-view">
                <i class='bx bx-task'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${registro.id}</span><span class="flotante-view ${registro.hora_fin ? 'green' : 'red'}">${registro.hora_fin ? restarHoras(registro.hora_inicio, registro.hora_fin) : 'Pendiente'}</span></span>
                    <span class="detalle">${registro.producto}</span>
                    <span class="pie">${registro.operador}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosTareas();

}


function eventosTareas() {
    const btnNuevaTarea = document.querySelectorAll('.nuevo-registro');
    const btnListaTareas = document.querySelectorAll('.btn-lista-tareas');

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
            const registroData = tareasGlobal.find(r => r.id === registro.dataset.id);
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
        const registro = tareasGlobal.find(r => r.id === registroId);
        if (!registro) return;

        function convertirHoraAMinutos(hora) {
            let [h, m] = hora.split(":").map(Number);
            return h * 60 + m;
        }

        function restarHoras(horaInicio, horaFin) {
            let inicioMin = convertirHoraAMinutos(horaInicio);
            let finMin = convertirHoraAMinutos(horaFin);
            let diff = finMin - inicioMin;

            // Convertimos de nuevo a HH:mm
            let horas = Math.floor(diff / 60);
            let minutos = diff % 60;
            return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        }

        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Información</p>
                    </div>
                    <div class="botones-container">
                        ${!registro.hora_fin ? `
                            <button class="btn-finalizar btn green"><i class='bx bx-check-circle'></i></button>
                        ` : ''}<button class="btn-editar btn blue"><i class="bx bx-edit"></i></button>
                            <button class="btn-eliminar btn red"><i class="bx bx-trash"></i></button>
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Información General</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-id-card'></i> ID: </span>${registro.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto: </span>${registro.producto}</div>
                </div>

                <p class="subtitulo">Horario</p>
                <div class="campo-horizontal">
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora Inicio: </span>${registro.hora_inicio}</div>
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora Fin: </span>${registro.hora_fin || 'Pendiente'}</div>
                        ${registro.hora_fin ? `
                            <div class="detalle-campo"><span><i class='bx bx-timer'></i> Tiempo Total: </span>
                                ${restarHoras(registro.hora_inicio, registro.hora_fin)}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <p class="subtitulo">Procedimientos</p>
                <div class="campo-vertical procedimientos">
                    ${registro.procedimientos.split(',').map(proc => `
                        <div class="detalle-campo"><span><i class='bx bx-check-circle'></i> ${proc.trim()}</span></div>
                    `).join('')}
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


        const btnFinalizar = contenido.querySelector('.btn-finalizar');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => finalizarTarea(registro));
        }


        const btnEditar = contenido.querySelector('.btn-editar');
        btnEditar.addEventListener('click', () => editar(registro));


        const btnEliminar = contenido.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', () => eliminar(registro));



        function eliminar(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Eliminar tarea</p>
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
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto: </span>${registro.producto}</div>
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora Inicio: </span>${registro.hora_inicio}</div>
                        <div class="detalle-campo"><span><i class='bx bx-user'></i> Operador: </span>${registro.operador}</div>
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
                            <p>Vas a eliminar un registro del sistema. Esta acción no se puede deshacer y podría afectar a otros registros relacionados. Asegúrate de que deseas continuar.</p>
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

                    const response = await fetch(`/eliminar-tarea/${registro.id}`, {
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
                        await obtenerTareas();
                        updateHTMLWithData();
                        ocultarScreen();
                        mostrarNotificacion('Se elimino la tarea', {tipo: 'exito', duracion:2000})
                    }

                } catch (error) {
                    mostrarNotificacion('Error al eliminar la tarea', {tipo: 'error'})
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
                            <p class="titulo">Editar tarea</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-editar-registro btn blue"><i class="bx bx-save"></i> Guardar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información General</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> ID: </span>${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto: </span>${registro.producto}</div>
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora Inicio: </span>${registro.hora_inicio}</div>
                        <div class="detalle-campo"><span><i class='bx bx-user'></i> Operador: </span>${registro.operador}</div>
                    </div>
        
                    <div class="etiquetas-container">
                        <div class="etiquetas-actuales">
                            ${registro.procedimientos.split(',').map(proc => `
                                <div class="etiqueta-item">
                                    <i class='bx bx-list-check'></i>
                                    <span>${proc.trim()}</span>
                                    <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
        
                    <p class="subtitulo">Agregar Procedimientos</p>
                    <div class="entrada">
                        <i class='bx bx-task'></i>
                        <div class="input">
                            <p class="detalle">Tareas</p>
                            <input class="tarea" type="text" autocomplete="off" placeholder=" " required>
                            <button type="button" class="btn-agregar-tarea-temp"><i class='bx bx-plus'></i></button>
                        </div>
                    </div>
                    <div class="sugerencias" id="tareas-list"></div>
        
                    <p class="subtitulo">Observaciones</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input type="text" class="observaciones" value="${registro.observaciones || ''}">
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
            const productoInput = document.querySelector('.entrada .tarea');
            const sugerenciasList = document.querySelector('#tareas-list');

            productoInput.addEventListener('input', (e) => {
                const valor = normalizarTexto(e.target.value);
                sugerenciasList.innerHTML = '';

                if (valor) {
                    const sugerencias = listaTareasGlobal.filter(p =>
                        normalizarTexto(p.tarea).includes(valor)
                    ).slice(0, 5);

                    if (sugerencias.length) {
                        sugerenciasList.style.display = 'flex';
                        sugerencias.forEach(p => {
                            const div = document.createElement('div');
                            div.classList.add('item');
                            div.textContent = p.tarea;
                            div.onclick = () => {
                                productoInput.value = p.tarea;
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

            // Configurar eventos para quitar etiquetas existentes
            document.querySelectorAll('.btn-quitar-etiqueta').forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.closest('.etiqueta-item').remove();
                });
            });

            // Configurar evento para agregar nuevas tareas
            const btnAgregarEtiqueta = contenido.querySelector('.btn-agregar-tarea-temp');
            btnAgregarEtiqueta.addEventListener('click', () => {
                const productoSeleccionado = productoInput.value.trim();
                const productoId = window.idPro;

                if (!productoSeleccionado || !productoId) {
                    mostrarNotificacion({
                        message: 'Debe seleccionar una tarea de la lista',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');
                const producto = listaTareasGlobal.find(p => p.id === productoId);

                if (producto) {
                    // Verificar si la tarea ya está agregada
                    const yaExiste = Array.from(etiquetasActuales.querySelectorAll('.etiqueta-item span'))
                        .some(span => span.textContent === producto.tarea);

                    if (yaExiste) {
                        mostrarNotificacion({
                            message: 'Esta tarea ya está agregada',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }

                    const nuevoProducto = document.createElement('div');
                    nuevoProducto.className = 'etiqueta-item';
                    nuevoProducto.innerHTML = `
                        <i class='bx bx-list-check'></i>
                        <span>${producto.tarea}</span>
                        <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                    `;

                    nuevoProducto.querySelector('.btn-quitar-etiqueta').addEventListener('click', () => {
                        nuevoProducto.remove();
                    });

                    etiquetasActuales.appendChild(nuevoProducto);
                    productoInput.value = '';
                    sugerenciasList.style.display = 'none';
                    window.idPro = null;

                    mostrarNotificacion({
                        message: 'Tarea agregada correctamente',
                        type: 'success',
                        duration: 2000
                    });
                }
            });

            // Configurar evento para guardar cambios
            const btnEditar = contenido.querySelector('.btn-editar-registro');
            btnEditar.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo').value.trim();
                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la edición')
                    return;
                }

                try {
                    mostrarCarga();
                    const procedimientos = Array.from(
                        contenido.querySelectorAll('.etiquetas-actuales .etiqueta-item span')
                    ).map(span => span.textContent.trim());

                    if (procedimientos.length === 0) {
                        throw new Error('Debe tener al menos un procedimiento');
                    }

                    const observaciones = contenido.querySelector('.observaciones').value.trim();

                    const response = await fetch(`/editar-tarea/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            procedimientos: procedimientos.join(','),
                            observaciones,
                            motivo
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerTareas();
                        info(registro.id)
                        updateHTMLWithData();
                        mostrarNotificacion('Se actualizo la tarea', {tipo: 'exito', duracion:2000})
                    }
                } catch (error) {
                    mostrarNotificacion('Error al actualizar la tarea', {tipo: 'error'})
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
        function finalizarTarea(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Terminar tarea</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-finalizar-tarea btn green"><i class='bx bx-check-circle'></i> Finalizar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información General</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> ID: </span>${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto: </span>${registro.producto}</div>
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora Inicio: </span>${registro.hora_inicio}</div>
                    </div>
                    <div class="etiquetas-container">
                        <div class="etiquetas-actuales">
                            
                        </div>
                    </div>
                    <p class="subtitulo">Productos</p>
                    <div class="entrada">
                        <i class='bx bx-task'></i>
                        <div class="input">
                            <p class="detalle">Tareas</p>
                            <input class="tarea" type="text" autocomplete="off" placeholder=" " required>
                            <button type="button" class="btn-agregar-tarea-temp"><i class='bx bx-plus'></i></button>
                        </div>
                    </div>
                    <div class="sugerencias" id="tareas-list"></div>
        
                    <p class="subtitulo">Observaciones</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input type="text" class="observaciones">
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por finalizar una tarea. Asegúrate de llenar los campos necesarios y con la información correcta, ya que esta accion no se puede deshacer.</p>
                        </div>
                    </div>

                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            const productoInput = document.querySelector('.entrada .tarea');
            const sugerenciasList = document.querySelector('#tareas-list');
            const btnFinalizar = document.querySelector('.btn-finalizar-tarea');
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
                    const sugerencias = listaTareasGlobal.filter(p =>
                        normalizarTexto(p.tarea).includes(valor)
                    ).slice(0, 5);

                    if (sugerencias.length) {
                        sugerenciasList.style.display = 'flex';
                        sugerencias.forEach(p => {
                            const div = document.createElement('div');
                            div.classList.add('item');
                            div.textContent = p.tarea;
                            div.onclick = () => {
                                productoInput.value = p.tarea;
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
            const btnAgregarEtiqueta = contenido.querySelector('.btn-agregar-tarea-temp');
            btnAgregarEtiqueta.addEventListener('click', () => {

                const productoSeleccionado = productoInput.value.trim();
                const productoId = window.idPro;

                if (!productoSeleccionado || !productoId) {
                    mostrarNotificacion('Debe seleccionar al menos una tarea')
                    return;
                }

                const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');
                const producto = listaTareasGlobal.find(p => p.id === productoId);

                if (producto) {
                    // Verificar si el producto ya está agregado
                    const yaExiste = Array.from(etiquetasActuales.querySelectorAll('.etiqueta-item span'))
                        .some(span => span.textContent === producto.tarea);

                    if (yaExiste) {
                        mostrarNotificacion('Esta tarea ya esta agregada')
                        return;
                    }

                    const nuevoProducto = document.createElement('div');
                    nuevoProducto.className = 'etiqueta-item';
                    nuevoProducto.innerHTML = `
                    <i class='bx bx-list-check'></i>
                    <span>${producto.tarea}</span>
                    <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                `;

                    // Agregar evento para eliminar la etiqueta
                    nuevoProducto.querySelector('.btn-quitar-etiqueta').addEventListener('click', () => {
                        nuevoProducto.remove();
                    });

                    etiquetasActuales.appendChild(nuevoProducto);
                    productoInput.value = '';
                    sugerenciasList.style.display = 'none';
                    window.idPro = null;
                }
            });
            btnFinalizar.addEventListener('click', async () => {
                try {
                    const observaciones = contenido.querySelector('.observaciones').value;

                    // Obtener todas las tareas seleccionadas
                    const tareasSeleccionadas = Array.from(
                        contenido.querySelectorAll('.etiquetas-actuales .etiqueta-item span')
                    ).map(span => span.textContent.trim());

                    if (tareasSeleccionadas.length === 0) {
                        mostrarNotificacion('Debe seleccionar al menos una tarea')
                        return;
                    }

                    mostrarCarga();

                    const response = await fetch(`/finalizar-tarea/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            procedimientos: tareasSeleccionadas.join(','),
                            observaciones: observaciones || ''
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerTareas();
                        info(registro.id)
                        updateHTMLWithData();
                        mostrarNotificacion('Se finalizo la tarea', {tipo: 'exito', duracion:2000})
                    }

                } catch (error) {
                    mostrarNotificacion('Error al finalizar la tarea', {tipo: 'error'})
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }

    }
    btnNuevaTarea.forEach(btn => {
        btn.addEventListener('click', mostrarFormularioNuevoRegistro);
    })
    btnListaTareas.forEach(btn => {
        btn.addEventListener('click', mostrarListaTareas);
    })

    async function mostrarListaTareas() {
        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Lista de tareas</p>
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Administrar Tareas</p>
                <div class="entrada">
                    <i class='bx bx-task'></i>
                    <div class="input">
                        <p class="detalle">Nueva Tarea</p>
                        <input class="nueva-tarea" type="text" autocomplete="off" placeholder=" " required>
                        <button class="btn-agregar-tarea"><i class='bx bx-plus'></i></button>
                    </div>
                </div>
                <p class="subtitulo">Lista de Tareas</p>
                <div class="lista-tareas-container">
                    ${listaTareasGlobal.map(tarea => `
                        <div class="tarea-item" data-id="${tarea.id}">
                            <span class="tarea-texto">${tarea.tarea}</span>
                            <button class="btn-eliminar-tarea" data-id="${tarea.id}">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        // Evento para agregar nueva tarea
        const btnAgregar = contenido.querySelector('.btn-agregar-tarea');
        const inputTarea = contenido.querySelector('.nueva-tarea');

        btnAgregar.addEventListener('click', async () => {
            const tarea = inputTarea.value.trim();
            if (!tarea) {
                mostrarNotificacion('Ingresa la tarea')
                return;
            }

            try {
                mostrarCarga();

                const response = await fetch('/agregar-tarea-lista', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tarea })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    mostrarNotificacion('Se agrego la tarea', {tipo: 'exito', duracion:2000})
                    await obtenerListaTareas();
                    mostrarListaTareas();
                }

            } catch (error) {
                mostrarNotificacion('Error al agregar la tarea', {tipo: 'error'})
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });

        // Eventos para eliminar tareas
        const btnsEliminar = contenido.querySelectorAll('.btn-eliminar-tarea');
        btnsEliminar.forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                try {
                    mostrarCarga();

                    const response = await fetch(`/eliminar-tarea-lista/${id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        mostrarNotificacion('Se elimino la tarea', {tipo: 'exito', duracion:2000})
                        await obtenerListaTareas();
                        mostrarListaTareas();
                    }

                } catch (error) {
                    mostrarNotificacion('Error al eliminar la tarea', {tipo: 'error'})
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        });
    }

    function mostrarFormularioNuevoRegistro() {
        const contenido = document.querySelector('.screen');
        const ahora = new Date();
        const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Nueva tarea</p>
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
                const sugerencias = productosGlobal.filter(p =>
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

        const btnRegistrar = contenido.querySelector('.btn-registrar');
        btnRegistrar.addEventListener('click', async () => {
            try {
                const productoSeleccionado = productoInput.value.trim();

                if (!productoSeleccionado) {
                    mostrarNotificacion('Debes seleccionar un producto')
                    return;
                }

                mostrarCarga();

                const response = await fetch('/registrar-tarea', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        producto: productoSeleccionado,
                        hora_inicio: horaActual,
                        operador: usuarioInfo.nombre
                    })
                });

                const data = await response.json();

                if (data.success) {
                    await obtenerTareas();
                    ocultarScreen();
                    updateHTMLWithData();
                    mostrarNotificacion('Se inicio una nueva tarea', {tipo: 'exito', duracion:2000})
                } else {
                    throw new Error(data.error);
                }

            } catch (error) {
                mostrarNotificacion('Error al iniciar la tarea', {tipo: 'error'})
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });
    }
    aplicarFiltros();
}