import { usuarioInfo } from "../../dashboard.js";
let pagosGlobal = [];

const DB_NAME = 'damabrava_db';
const PAGOS_DB = 'pagos';


async function obtenerPagos() {
    try {

        const pagosCache = await obtenerLocal(PAGOS_DB, DB_NAME);

        if (pagosCache.length > 0) {
            pagosGlobal = pagosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }

        try {

            const response = await fetch('/obtener-pagos');
            const data = await response.json();

            if (data.success) {
                pagosGlobal = data.pagos.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

                if (JSON.stringify(pagosCache) !== JSON.stringify(pagosGlobal)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    updateHTMLWithData();

                    (async () => {
                        try {
                            const db = await initDB(PAGOS_DB, DB_NAME);
                            const tx = db.transaction(PAGOS_DB, 'readwrite');
                            const store = tx.objectStore(PAGOS_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of pagosGlobal) {
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
        console.error('Error al obtener los pagos:', error);
        return false;
    }
}
async function cargarPagosParciales(pagoId) {
    try {
        mostrarCargaObtener();
        const response = await fetch(`/obtener-pagos-parciales/${pagoId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    } finally {
        ocultarCargaObtener();
    }
}

export async function mostrarPagos() {
    renderInitialHTML();
    const [pagos] = await Promise.all([
        await obtenerPagos()
    ]);
}
function renderInitialHTML() {
    const view = document.querySelector('.pagos-cont');
    const initialHTML = `  
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Pagos</p>
                </div>
                <div class="botones-container">
                    <button class="nuevo-pago-generico btn trans"><i class='bx bx-plus'></i>Nuevo</button>
                </div>
            </div>
            <div class="buscador-view">
                <button class="lupa"><i class='bx bx-search'></i></button>
                <input type="text" class="search" placeholder="Buscar...">
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
                <button class="limpiar-search" style="right:45px"><i class='bx bx-x'></i></button>
            </div>
            <div class="filtros-view">
                <button class="btn-filtro activo">Todos</button>
                <button class="btn-filtro">Pagados</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Anulados</button>
                <select class="tipo">
                    <option value="todos" selected>Todos</option>
                    <option value="genericos">Genericos</option>
                    <option value="produccion">Producción</option>
                    <option value="almacen">Almacen</option>
                    <option value="Acopio">Acopio</option>
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
    const productosContainer = document.querySelector('.pagos-cont .contenido-view');
    const productosHTML = pagosGlobal.map(registro => `
        <div class="item-view" data-id="${registro.id}">
            <div class="header-view">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${registro.id}</span><span class="flotante-view ${registro.estado === 'Pendiente' ? 'red' : registro.estado === 'Pagado' ? 'green' : 'orange'}">${registro.estado}</span></span>
                    <span class="detalle"><strong>${registro.nombre_pago} (${registro.beneficiario})</strong></span>
                    <span class="pie">${registro.fecha}<span class="neutro">Bs. ${registro.total}</span></span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosPagos();
}


function eventosPagos() {
    const btnExcel = document.querySelectorAll('.exportar-excel');
    const registrosAExportar = pagosGlobal;
    const btnNuevoPago = document.querySelectorAll('.nuevo-pago-generico');
    const botonCalendario = document.querySelector('.btn-calendario');

    const botonesEstado = document.querySelectorAll('.filtros-view .btn-filtro');
    const selectTipo = document.querySelector('.filtros-view .tipo');


    const items = document.querySelectorAll('.item-view');
    const inputBusqueda = document.querySelector('.search');
    const btnLimpiar = document.querySelector('.limpiar-search');

    let filtroFechaInstance = null;
    let filtroEstadoActual = 'Todos';
    let filtroTipoActual = 'Todos'; // Nuevo

    // Nuevo

    // Agregar listener para el select de tipo
    selectTipo.addEventListener('change', function () {
        filtroTipoActual = this.value;
        aplicarFiltros();
    });
    selectTipo.addEventListener('focus', function () {
        scrollToCenter(this, this.parentElement);
    });

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
            const registroData = pagosGlobal.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Filtro por tipo
            if (filtroTipoActual !== 'todos') {
                switch (filtroTipoActual) {
                    case 'genericos':
                        mostrar = registroData.tipo === 'generico';
                        break;
                    case 'produccion':
                        mostrar = registroData.tipo === 'produccion';
                        break;
                    case 'almacen':
                        mostrar = registroData.tipo === 'almacen';
                        break;
                    case 'Acopio':
                        mostrar = registroData.tipo === 'Acopio';
                        break;
                }
            }

            // Filtro por estado
            if (mostrar && filtroEstadoActual && filtroEstadoActual !== 'Todos') {
                if (filtroEstadoActual === 'Pendientes') {
                    mostrar = registroData.estado === 'Pendiente';
                } else if (filtroEstadoActual === 'Pagados') {
                    mostrar = registroData.estado === 'Pagado';
                } else if (filtroEstadoActual === 'Anulados') {
                    mostrar = registroData.estado === 'Anulado';
                }
            }

            // Filtro por fecha (mantener existente)
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

            // Filtro por búsqueda (mantener existente)
            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.nombre_pago,
                    registroData.beneficiario,
                    registroData.fecha,
                    registroData.justificativos,
                    registroData.tipo
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

    window.info = function (pagoId) {
        const pago = pagosGlobal.find(p => p.id === pagoId);
        if (!pago) return;

        const contenido = document.querySelector('.screen');
        let registrationHTML;

        if (pago.tipo === 'generico' || pago.tipo === 'Acopio') {
            // Template para pagos genéricos
            registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Información</p>
                        </div>
                        <div class="botones-container">
                            ${pago.estado !== 'Anulado' ? ` <button class="btn-anular btn orange"><i class='bx bx-x-circle'></i></button>` : ''}
                            ${pago.estado === 'Pendiente' ? ` <button class="btn-pagar btn green"><i class='bx bx-dollar'></i> Pagar</button>` : ` <button class="btn-pagar btn blue"><i class='bx bx-show'></i> Pagos</button>`}
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <p class="subtitulo">Información del pago</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Comprobante: </span><span>${pago.id}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span><span>${pago.nombre_pago}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-user'></i> Beneficiario: </span><span>${pago.beneficiario}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-envelope'></i> Email: </span><span>${pago.id_beneficiario}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span><span>${pago.fecha}</span></div>
                    </div>
    
                    <p class="subtitulo">Detalles del pago</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-detail'></i> Concepto: </span></div>
                        <div class="detalle-campo">${pago.justificativos}</div>
                        <hr style="margin: 10px 0; opacity: 0.2;">
                        <div class="detalle-campo"><span><i class='bx bx-dollar'></i> Monto Base: </span><span>Bs. ${pago.subtotal}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-minus-circle'></i> Descuento: </span><span>Bs. ${pago.descuento}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-plus-circle'></i> Aumento: </span><span>Bs. ${pago.aumento}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-dollar-circle'></i> Total: </span><span>Bs. ${pago.total}</span></div>
                        ${pago.observaciones ? `<div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones: </span></div>
                           <span style="padding-left:20px;width: 100%;">${pago.observaciones}</span>` : ''}
                    </div>
    
                    <p class="subtitulo">Información administrativa</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-user-check'></i> Registrado por: </span> <span>${pago.pagado_por}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-check-circle'></i> Estado: </span><span>${pago.estado}</span></div>
                    </div>
                </div>
            `;
        } else {
            // Procesar justificativos para pagos normales (existente)
            const justificativosFormateados = pago.justificativos.split(';').map(j => {
                const [producto, valores] = j.split('(');
                const [envasado, etiquetado, sellado, cernido] = valores.replace(')', '').split(',');

                return {
                    producto,
                    envasado: parseFloat(envasado),
                    etiquetado: parseFloat(etiquetado),
                    sellado: parseFloat(sellado),
                    cernido: parseFloat(cernido),
                    total: parseFloat(envasado) + parseFloat(etiquetado) + parseFloat(sellado) + parseFloat(cernido)
                };
            });

            const totales = justificativosFormateados.reduce((acc, j) => {
                acc.envasado += j.envasado;
                acc.etiquetado += j.etiquetado;
                acc.sellado += j.sellado;
                acc.cernido += j.cernido;
                return acc;
            }, { envasado: 0, etiquetado: 0, sellado: 0, cernido: 0 });

            // Template para pagos normales (mantener el existente)
            registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Información</p>
                        </div>
                        <div class="botones-container">
                            ${pago.estado !== 'Anulado' ? ` <button class="btn-anular btn orange"><i class='bx bx-x-circle'></i></button>` : ''}
                            ${pago.estado === 'Pendiente' ? ` <button class="btn-pagar btn green"><i class='bx bx-dollar'></i> Pagar</button>` : ` <button class="btn-pagar btn blue"><i class='bx bx-show'></i> Pagos</button>`}
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <p class="subtitulo">Información del pago</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Comprobante: </span><span>${pago.id}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Nombre: </span><span>${pago.nombre_pago}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-user'></i> Beneficiario: </span><span>${pago.beneficiario}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-envelope'></i> Email: </span><span>${pago.id_beneficiario}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-calendar'></i> Fecha: </span><span>${pago.fecha}</span></div>
                    </div>

                    <p class="subtitulo">Detalles del pago</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-package'></i> Total Envasado: </span><span>Bs. ${totales.envasado.toFixed(2)}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-tag'></i> Total Etiquetado: </span><span>Bs. ${totales.etiquetado.toFixed(2)}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-purchase-tag'></i> Total Sellado: </span><span>Bs. ${totales.sellado.toFixed(2)}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-filter'></i> Total Cernido: </span><span>Bs. ${totales.cernido.toFixed(2)}</span></div>
                        <hr style="margin: 10px 0; opacity: 0.5; color:gray">
                        <div class="detalle-campo"><span><i class='bx bx-dollar'></i> Subtotal: </span><span>Bs. ${pago.subtotal}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-minus-circle'></i> Descuento: </span><span>Bs. ${pago.descuento}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-plus-circle'></i> Aumento: </span><span>Bs. ${pago.aumento}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-dollar-circle'></i> Total: </span><span>Bs. ${pago.total}</span></div>
                        ${pago.observaciones ? `<div class="detalle-campo"><span><i class='bx bx-comment-detail'></i> Observaciones: </span><span style="padding-left:20px;width: 100%;">${pago.observaciones}</span></div>
                            ` : ''}
                        
                    </div>

                    <p class="subtitulo">Detalle de justificativos</p>
                    <div class="tabla-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Envasado</th>
                                    <th>Etiquetado</th>
                                    <th>Sellado</th>
                                    <th>Cernido</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${justificativosFormateados.map(j => `
                                    <tr>
                                        <td>${j.producto}</td>
                                        <td>Bs. ${j.envasado.toFixed(2)}</td>
                                        <td>Bs. ${j.etiquetado.toFixed(2)}</td>
                                        <td>Bs. ${j.sellado.toFixed(2)}</td>
                                        <td>Bs. ${j.cernido.toFixed(2)}</td>
                                        <td><strong>Bs. ${j.total.toFixed(2)}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <p class="subtitulo">Información administrativa</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-user-check'></i> Registrado por: </span><span>${pago.pagado_por}</span></div>
                    </div>
                </div>
            `;
        }

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        const pagarBtn = contenido.querySelector('.btn-pagar');
        const btnAnular = contenido.querySelector('.btn-anular');

        pagarBtn.addEventListener('click', () => realizarPago(pago));
        btnAnular.addEventListener('click', () => anular(pago));

        function anular(pago) {
            const contenido = document.querySelector('.screen2');
            const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                            <p class="titulo">Anular pago</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-anular-pago btn red"><i class='bx bx-x-circle'></i> Anular pago</button>
                        </div>
                    </div>
                </div>
                
                <div class="contenido">
                    <p class="subtitulo">Información del pago</p>
                    <div class="campo-vertical">
                        <div class="detalle-campo"><span><i class='bx bx-id-card'></i>Comprobante: </span><span>${pago.id}</span></div>
                        <div class="detalle-campo"><span><i class='bx bx-user'></i> Beneficiario: </span><span></span>${pago.beneficiario}</div>
                        <div class="detalle-campo"><span><i class='bx bx-dollar-circle'></i> Total: </span><span>Bs. ${pago.total}</span></div>
                    </div>
        
                    <p class="subtitutlo">Motivo de la anulación</p>
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

            const btnAnularPago = contenido.querySelector('.btn-anular-pago');
            btnAnularPago.addEventListener('click', confirmarAnulacion);

            async function confirmarAnulacion() {
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion('Ingresa el motivo de la anulación')
                    return;
                }

                try {
                    mostrarCarga();
                    const response = await fetch(`/anular-pago/${pago.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerPagos();
                        info(pagoId);
                        updateHTMLWithData();
                        mostrarNotificacion('Se anulo el pago', {tipo: 'exito', duracion:2000})
                    } else {
                        mostrarNotificacion('Error al anular pago', {tipo: 'error'})
                        throw new Error(data.error || 'Error al anular el pago');
                    }
                } catch (error) {
                    mostrarNotificacion('Error al anular pago', {tipo: 'error'})
                    console.error('Error:', error);
                } finally {
                    ocultarCarga();
                }
            }
        }
        function realizarPago(pago) {
            const contenido = document.querySelector('.screen2');
            function redondearDecimalPersonalizado(valor) {
                const decimal = valor - Math.floor(valor);
                if (decimal < 0.5) {
                    return Math.floor(valor).toFixed(2);
                } else {
                    return Math.ceil(valor).toFixed(2);
                }
            }
            // Primero cargar los pagos parciales
            cargarPagosParciales(pago.id).then(datosPagos => {
                if (!datosPagos) return;
                const { pagosParciales, totalPagado, saldoPendiente } = datosPagos;
                const saldoPendienteOf = redondearDecimalPersonalizado(saldoPendiente);

                const registrationHTML = `
                    <div class="top-view">
                        <div class="encabezado">
                            <div class="titulo-back">
                                <button class="atras-screen" onclick="ocultarScreen2();"><i class='bx bx-arrow-back'></i></button>
                                <p class="titulo">Pagos parciales</p>
                            </div>
                            ${saldoPendienteOf > 0 && pago.estado !== 'Anulado' ? `
                                <div class="botones-container">
                                    <button class="btn-realizar-pago btn green">
                                        <i class='bx bx-check-circle'></i> Realizar pago
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                        
                    <div class="contenido">
                        <p class="subtitulo">Información del pago</p>
                        <div class="campo-vertical">
                            <div class="detalle-campo"><span><i class='bx bx-id-card'></i> Comprobante: </span><span>${pago.id}</span></div>
                            <div class="detalle-campo"><span><i class='bx bx-user'></i> Beneficiario: </span><span>${pago.beneficiario}</span></div>
                            <div class="detalle-campo"><span><i class='bx bx-dollar-circle'></i> Total a pagar: </span><span>Bs. ${pago.total}</span></div>
                            <div class="detalle-campo"><span><i class='bx bx-dollar-circle'></i> Total pagado: </span><span>Bs. ${totalPagado.toFixed(2)}</span></div>
                            <div class="detalle-campo"><span><i class='bx bx-dollar-circle'></i> Saldo pendiente: </span><pan>Bs. ${saldoPendienteOf}</pan></div>
                        </div>

                        ${saldoPendienteOf > 0 && pago.estado !== 'Anulado' ? `
                            <p class="subtitulo">Detalles del pago</p>
                            <div class="entrada">
                                <i class='bx bx-dollar'></i>
                                <div class="input">
                                    <p class="detalle">Cantidad a pagar</p>
                                    <input class="cantidad_pago" type="number" step="0.01" min="0.01" max="${saldoPendiente}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-comment-detail'></i>
                                <div class="input">
                                    <p class="detalle">Observaciones</p>
                                    <input class="observaciones" type="text" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                        ` : ''}
                        <p class="subtitulo">Historial de pagos</p>
                        ${pagosParciales.length > 0 ? `
                        <div class="tabla-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Monto</th>
                                        <th>Pagado por</th>
                                        <th>Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pagosParciales.map(p => `
                                        <tr>
                                            <td>${p.fecha}</td>
                                            <td>Bs. ${parseFloat(p.cantidad_pagada).toFixed(2)}</td>
                                            <td>${p.pagado_por}</td>
                                            <td>${p.observaciones}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        ` : ` <div class="no-hay"><i class='bx bx-dollar-circle'></i> <p>No hay pagos parciales registrados para este pago.</p></div>`}
                    </div>
                `;

                contenido.innerHTML = registrationHTML;
                mostrarScreen2();

                // Solo agregar el evento si hay saldo pendiente
                if (saldoPendienteOf > 0) {
                    const btnRealizarPago = contenido.querySelector('.btn-realizar-pago');
                    btnRealizarPago.addEventListener('click', async () => {
                        const cantidad = parseFloat(document.querySelector('.cantidad_pago').value);
                        const observaciones = document.querySelector('.observaciones').value.trim();

                        if (!cantidad || cantidad <= 0 || cantidad > saldoPendienteOf) {
                            console.error('Cantidad inválida:', cantidad, 'Saldo pendiente:', saldoPendienteOf);
                            return;
                        }

                        if (!observaciones) {
                            mostrarNotificacion('Ingresa las observaciones')
                            return;
                        }

                        try {
                            mostrarCarga();
                            const response = await fetch('/registrar-pago-parcial', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    pago_id: pago.id,
                                    pagado_por: usuarioInfo.nombre + ' ' + usuarioInfo.apellido,
                                    beneficiario: pago.beneficiario,
                                    cantidad_pagada: cantidad,
                                    observaciones
                                })
                            });

                            const data = await response.json();

                            if (data.success) {
                                await obtenerPagos();
                                updateHTMLWithData();
                                info(pagoId);
                                cargarPagosParciales(pagoId);
                                ocultarProgreso('.pro-pago');
                                mostrarNotificacion('Se realizo el pago parcial', {tipo: 'exito', duracion:2000})
                            } else {
                                mostrarNotificacion('Error al registrar pago parcial', {tipo: 'error'})
                                throw new Error(data.error);
                            }
                        } catch (error) {
                            mostrarNotificacion('Error al registrar pago parcial', {tipo: 'error'})
                            console.error('Error:', error);
                        } finally {
                            ocultarProgreso('.pro-pago');
                        }
                    });
                }
            });
        }
    };
    btnNuevoPago.forEach(btn => {
        btn.addEventListener('click', nuevoPagoGenerico);
    })
    btnExcel.forEach(btn => {
        btn.addEventListener('click', () => exportarArchivos('pagos', registrosAExportar));
    })

    function nuevoPagoGenerico() {
        const contenido = document.querySelector('.screen');
        const registrationHTML = `
        
            <div class="encabezado">
                <div class="titulo-back">
                    <button class="atras-screen" onclick="ocultarScreen();"><i class='bx bx-arrow-back'></i></button>
                    <p class="titulo">Nuevo pago</p>
                </div>
                <div class="botones-container">
                    <button class="btn-guardar btn green"><i class='bx bx-save'></i> Guardar Pago</button>
                </div>
            </div>
                <form id="formNuevoPago" class="contenido">
                    <p class="subtitulo">Información General</p>
                    <div class="entrada">
                        <i class='bx bx-purchase-tag'></i>
                        <div class="input">
                            <p class="detalle">Nombre del Pago</p>
                            <input type="text" name="nombre_pago" required>
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-user'></i>
                        <div class="input">
                            <p class="detalle">Beneficiario</p>
                            <input type="text" name="beneficiario" required placeholder=" ">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-envelope'></i>
                        <div class="input">
                            <p class="detalle">ID Beneficiario (Email)</p>
                            <input type="email" name="id_beneficiario" required placeholder=" ">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-user-check'></i>
                        <div class="input">
                            <p class="detalle">Registrado por</p>
                            <input type="text" name="pagado_por" value="${usuarioInfo.nombre} ${usuarioInfo.apellido}" readonly>
                        </div>
                    </div>
    
                    <p class="subtitulo">Detalles del Pago</p>
                    <div class="entrada">
                        <i class='bx bx-detail'></i>
                        <div class="input">
                            <p class="detalle">Concepto del Pago</p>
                            <input type="text" name="justificativos" required>
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-dollar'></i>
                        <div class="input">
                            <p class="detalle">Monto Base</p>
                            <input type="number" name="subtotal" step="0.01" required placeholder=" " onchange="calcularTotal()">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-minus-circle'></i>
                        <div class="input">
                            <p class="detalle">Descuento</p>
                            <input type="number" name="descuento" step="0.01" value="0" placeholder=" " onchange="calcularTotal()">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-plus-circle'></i>
                        <div class="input">
                            <p class="detalle">Aumento</p>
                            <input type="number" name="aumento" step="0.01" value="0" placeholder=" " onchange="calcularTotal()">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-dollar-circle'></i>
                        <div class="input">
                            <p class="detalle">Total a Pagar</p>
                            <input type="number" name="total" step="0.01" value="0" readonly>
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones </p>
                            <input type="text" name="observaciones" >
                        </div>
                    </div>
                </form>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarScreen();

        // Función para calcular el total
        window.calcularTotal = function () {
            const subtotal = parseFloat(document.querySelector('input[name="subtotal"]').value) || 0;
            const descuento = parseFloat(document.querySelector('input[name="descuento"]').value) || 0;
            const aumento = parseFloat(document.querySelector('input[name="aumento"]').value) || 0;
            const total = subtotal - descuento + aumento;
            document.querySelector('input[name="total"]').value = total.toFixed(2);
        };

        // Evento para guardar el pago
        const btnGuardar = contenido.querySelector('.btn-guardar');
        btnGuardar.addEventListener('click', async () => {
            try {
                mostrarCarga();
                const formData = new FormData(document.getElementById('formNuevoPago'));
                const data = Object.fromEntries(formData.entries());

                // Validaciones básicas
                if (!data.nombre_pago || !data.beneficiario || !data.id_beneficiario || !data.justificativos || !data.subtotal) {
                    mostrarNotificacion('Ingresar todos los campos')
                    return;
                }

                const response = await fetch('/registrar-pago', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...data,
                        subtotal: parseFloat(data.subtotal),
                        descuento: parseFloat(data.descuento),
                        aumento: parseFloat(data.aumento),
                        total: parseFloat(data.total),
                        tipo: 'generico' // Identificador para pagos genéricos
                    })
                });

                const result = await response.json();

                if (result.success) {
                    await obtenerPagos();
                    info(result.id);
                    updateHTMLWithData();
                    mostrarNotificacion('Se registro el pago', {tipo:'exito', duracion:2000})
                } else {
                    mostrarNotificacion('Error al registrar pago', {tipo:'error'})
                    throw new Error(result.error);
                }
            } catch (error) {
                mostrarNotificacion('Error al registrar pago', {tipo:'error'})
                console.error('Error:', error);
            } finally {
                ocultarCarga();
            }
        });
    }

    aplicarFiltros();
}