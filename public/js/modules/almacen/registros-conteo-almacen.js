let registrosConteos = [];
const DB_NAME = 'damabrava_db';
const REGISTROS_CONTEO_DB = 'registros_conteo';

async function obtenerRegistrosConteo() {
    try {

        const registrosConteoCache = await obtenerLocal(REGISTROS_CONTEO_DB, DB_NAME);

        if (registrosConteoCache.length > 0) {
            registrosConteos = registrosConteoCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-registros-conteo');
        const data = await response.json();

        if (data.success) {
            registrosConteos = data.registros.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(registrosConteos) !== JSON.stringify(registrosConteoCache)) {
                console.log('Diferencias encontradas, actualizando UI');
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(REGISTROS_CONTEO_DB, DB_NAME);
                        const tx = db.transaction(REGISTROS_CONTEO_DB, 'readwrite');
                        const store = tx.objectStore(REGISTROS_CONTEO_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of registrosConteos) {
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
        console.error('Error al obtener registros:', error);
        return false;
    }
}

export async function mostrarRegistrosConteoAlmacen() {
    renderInitialHTML();

    const [obtnerRegistros] = await Promise.all([
        await obtenerRegistrosConteo(),
    ]);
}
function renderInitialHTML() {
    const view = document.querySelector('.registros-conteo-almacen-cont');
    const initialHTML = `  
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Registros conteo</p>
                </div>
            </div>
            <div class="buscador-view">
                <button class="lupa"><i class='bx bx-search'></i></button>
                <input type="text" class="search" placeholder="Buscar...">
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
                <button class="limpiar-search" style="right:45px"><i class='bx bx-x'></i></button>
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

    const productosContainer = document.querySelector('.registros-conteo-almacen-cont .contenido-view');
    const productosHTML = registrosConteos.map(registro => `
        <div class="item-view" data-id="${registro.id}">
            <div class="header-view">
                <i class='bx bx-package'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${registro.id}</span></span>
                    <span class="detalle">${registro.nombre}</span>
                    <span class="pie">${registro.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosRegistrosConteo();
}


function eventosRegistrosConteo() {
    const items = document.querySelectorAll('.item-view');
    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');
    const btnLimpiar = document.querySelector('.limpiar-search');


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
    function aplicarFiltros() {

        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = registrosConteos.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };
            let mostrar = true;

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
                    registroData.nombre,
                    registroData.fecha,
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

    window.info = function (registroId) {
        const registro = registrosConteos.find(r => r.id === registroId);
        if (!registro) return;

        const productos = registro.productos.split(';');
        const sistema = registro.sistema.split(';');
        const fisico = registro.fisico.split(';');
        const diferencias = registro.diferencia.split(';');

        const contenido = document.querySelector('.screen');
        const registrationHTML = `
            <div class="top-view">
                <div class="encabezado">
                    <div class="titulo-back">
                        <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                        <p class="titulo">Información</p>
                    </div>
                    <div class="botones-container">
                        ${tienePermiso('edicion') ? `<button class="btn-editar btn blue" data-id="${registro.id}"><i class='bx bx-edit'></i></button>` : ''}
                        ${tienePermiso('eliminacion') ? `<button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i></button>` : ''}
                        <button class="btn-sobre-escribir btn orange" data-id="${registro.id}"><i class='bx bx-revision'></i></button>
                    </div>
                </div>
            </div>
            <div class="contenido">
                <p class="subtitulo">Información básica</p>
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-hash'></i> ID:</span> ${registro.id}</div>
                    <div class="detalle-campo"><span><i class='bx bx-label'></i> Nombre:</span> ${registro.nombre || 'Sin nombre'}</div>
                    <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha:</span> ${registro.fecha}</div>
                    <div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones:</span> ${registro.observaciones || 'Sin observaciones'}</div>
                </div>
                <p class="subtitulo">Productos contados</p>
                ${productos.map((producto, index) => {
                const diferencia = parseInt(diferencias[index]);
                const colorDiferencia = diferencia > 0 ? '#4CAF50' : diferencia < 0 ? '#f44336' : '#2196F3';
                return `
                <div class="campo-vertical">
                    <div class="detalle-campo"><span><i class='bx bx-package'></i> Producto:</span> ${producto}</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; gap:5px">
                        <div class="detalle-campo"><span><i class='bx bx-box'></i> Sistema: ${sistema[index]}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-calculator'></i> Físico: ${fisico[index]}</span></div>
                        <div class="detalle-campo" style="color: ${colorDiferencia}"><span><i class='bx bx-transfer'></i> Dif.: ${diferencia > 0 ? '+' : ''}${diferencia}</span></div>
                    </div>
                </div>
                    `;
            }).join('')}
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        if (tienePermiso('edicion')) {
            const btnEditar = contenido.querySelector('.btn-editar');
            btnEditar.addEventListener('click', () => editar(registro));
        }
        if (tienePermiso('eliminacion')) {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }

        const btnSobre = contenido.querySelector('.btn-sobre-escribir');
        btnSobre.addEventListener('click', () => sobreescribir(registro));


        function eliminar(registro) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Eliminar conteo</p>
                        </div>
                        <div class="botones-container">
                            <button id="confirmar-eliminacion" class="btn red"><i class='bx bx-trash'></i> Eliminar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información del conteo a eliminar</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-hash'></i> ID:</span> ${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-label'></i> Nombre:</span> ${registro.nombre || 'Sin nombre'}</div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha:</span> ${registro.fecha}</div>
                        <div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones:</span> ${registro.observaciones || 'Sin observaciones'}</div>
                    </div>
                    <p class="subtitulo">Ingresa el motivo de la eliminación</p>
                    <div class="entrada">
                        <i class='bx bx-message-square-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo de eliminación</p>
                            <input type="text" class="motivo-eliminacion" placeholder=" " required>
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

            document.getElementById('confirmar-eliminacion').addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-eliminacion').value.trim();
                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la eliminación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/eliminar-conteo/${registro.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerRegistrosConteo();
                        ocultarScreen();
                        updateHTMLWithData();
                        mostrarNotificacion('Se elimino el conteo', {tipo: 'exito', duracion:2000})
                    } else {
                        throw new Error(data.error || 'Error al eliminar el registro');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al eliminar el conteo', {tipo: 'error'})
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
                            <p class="titulo">Editar conteo</p>
                        </div>
                        <div class="botones-container">
                            <button id="guardar-edicion" class="btn blue"><i class='bx bx-save'></i> Guardar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información basica</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-hash'></i> ID:</span> ${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha:</span> ${registro.fecha}</div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-label'></i>
                        <div class="input">
                            <p class="detalle">Nombre del conteo</p>
                            <input class="nombre-conteo" type="text" value="${registro.nombre || ''}" required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="observaciones" type="text" value="${registro.observaciones || ''}" required>
                        </div>
                    </div>
                    <p class="subtitulo">Igresa el motivo de la edición</p>
                    <div class="entrada">
                        <i class='bx bx-message-square-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo de edición</p>
                            <input type="text" class="motivo-edicion" placeholder=" " required>
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

            document.getElementById('guardar-edicion').addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-edicion').value.trim();
                const nombreEditado = document.querySelector('.nombre-conteo').value.trim();
                const observacionesEditadas = document.querySelector('.observaciones').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la edición')
                    return;
                }

                if (!nombreEditado) {
                    mostrarNotificacion('Debe ponerle un nomrbe al conteo')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/editar-conteo/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nombre: nombreEditado,
                            observaciones: observacionesEditadas,
                            motivo
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerRegistrosConteo();
                        info(registroId);
                        updateHTMLWithData();
                        mostrarNotificacion('Se actualizo el conteo', {tipo: 'exito', duracion:2000})
                    } else {
                        throw new Error(data.error || 'Error al actualizar el conteo');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al actualizar el conteo', {tipo: 'error'})
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function sobreescribir(registro) {
            const contenido = document.querySelector('.screen2');
            const [fecha, hora] = registro.fecha.split(',').map(item => item.trim());

            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Sobreescribir</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-confirmar-sobreescritura btn red"><i class='bx bx-edit'></i> Confirmar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                    <p class="subtitulo">Información del conteo</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span>${fecha}</div>
                        <div class="detalle-campo"><span><i class='bx bx-time'></i> Hora: </span>${hora}</div>
                        <div class="detalle-campo"><span><i class='bx bx-user'></i> Operario: </span>${registro.operario}</div>
                    </div>

                    <p class="subtitulo">Motivo de la sobreescritura</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo-sobreescritura" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por sobre escribir el stock del almacen con el stock de este registro. Asegúrate de que el stock en este registro es el correcto, por que esta accion no se puede deshacer.</p>
                        </div>
                    </div>

                </div>
            `;

            contenido.innerHTML = registrationHTML;
            mostrarScreen2();

            const btnConfirmarSobreescritura = contenido.querySelector('.btn-confirmar-sobreescritura');
            btnConfirmarSobreescritura.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-sobreescritura').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la sobreescritura')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/sobreescribir-inventario/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await mostrarAlmacenGeneral();
                        mostrarNotificacion('Se sobreescribio el inventario', {tipo: 'exito', duracion:2000})
                    } else {
                        throw new Error(data.error);
                    }
                } catch (error) {
                    mostrarNotificacion('Error al sobreescribir el inventario', {tipo: 'error'})
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            });
        }
    };
    aplicarFiltros();
}