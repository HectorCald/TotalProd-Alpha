let productosGlobal = [];
let configuracionHorario = {
    horaInicio: '',
    horaFin: '',
    estado: ''
};
const DB_NAME = 'damabrava_db';
const PRODUCTOS_FORM_db = 'productos_form';
const HORARIO_DB = 'horario_form';

async function verificarHorarioProduccion() {
    try {
        mostrarCargaObtener();

        // Intentar obtener horario del cache primero
        const horarioCache = await obtenerLocal(HORARIO_DB, DB_NAME);

        if (horarioCache.length > 0) {
            configuracionHorario = horarioCache[0].data;
            console.log('Obteniendo horario desde cache');
        }

        // Obtener datos del servidor
        const response = await fetch('/obtener-configuraciones');
        const data = await response.json();

        if (!data.success) {
            throw new Error('No se pudieron obtener las configuraciones');
        }

        const { horario, sistema } = data.configuraciones;

        // Crear nuevo objeto de configuración
        const nuevaConfiguracion = {
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            estado: sistema.estado
        };

        // Comparar con cache y actualizar si es diferente
        if (JSON.stringify(configuracionHorario) !== JSON.stringify(nuevaConfiguracion)) {
            console.log('Diferencias encontradas en horario, actualizando cache');

            try {
                const db = await initDB(HORARIO_DB, DB_NAME);
                const tx = db.transaction(HORARIO_DB, 'readwrite');
                const store = tx.objectStore(HORARIO_DB);

                // Limpiar store anterior
                await store.clear();

                // Guardar nueva configuración
                await store.put({
                    id: 'horario-config',
                    data: nuevaConfiguracion,
                    timestamp: Date.now()
                });

                console.log('Cache de horario actualizado correctamente');
            } catch (error) {
                console.error('Error actualizando el cache de horario:', error);
            }
        } else {
            console.log('Horario no ha cambiado');
        }

        // Actualizar configuración global
        configuracionHorario = nuevaConfiguracion;

        // Verificar si el sistema está activo
        if (sistema.estado !== 'Activo') {
            return {
                permitido: false,
                horario: 'Sistema inactivo'
            };
        }

        const horaActual = new Date();
        const [horaInicio, minutosInicio] = horario.horaInicio.split(':').map(Number);
        const [horaFin, minutosFin] = horario.horaFin.split(':').map(Number);

        const tiempoActual = horaActual.getHours() * 60 + horaActual.getMinutes();
        const tiempoInicio = horaInicio * 60 + minutosInicio;
        const tiempoFin = horaFin * 60 + minutosFin;

        return {
            permitido: tiempoActual >= tiempoInicio && tiempoActual <= tiempoFin,
            horario: `${configuracionHorario.horaInicio} a ${configuracionHorario.horaFin}`
        };

    } catch (error) {
        console.error('Error al verificar horario:', error);
        if (error.message === 'cancelled') {
            console.log('Operación cancelada por el usuario');
            return;
        }
        return {
            permitido: false,
            horario: 'Error al verificar horario'
        };
    } finally {
        ocultarCargaObtener();
    }
}

async function obtenerProductos() {
    try {
        mostrarCargaObtener();

        const productosFormCache = await obtenerLocal(PRODUCTOS_FORM_db, DB_NAME);

        if (productosFormCache.length > 0) {
            productosGlobal = productosFormCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-productos-form');
        const data = await response.json();

        if (data.success) {
            productosGlobal = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });


            if (JSON.stringify(productosFormCache) !== JSON.stringify(productosGlobal)) {
                console.log('Diferencias encontradas, actualizando UI');

                (async () => {
                    try {
                        const db = await initDB(PRODUCTOS_FORM_db, DB_NAME);
                        const tx = db.transaction(PRODUCTOS_FORM_db, 'readwrite');
                        const store = tx.objectStore(PRODUCTOS_FORM_db);

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
            mostrarNotificacion({
                message: 'Error al obtener productos',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return false;
    } finally {
        ocultarCargaObtener();
    }
}
export async function mostrarFormularioProduccion() {
    obtenerProductos();
    const view = document.querySelector('.formulario-produccion-cont');
    const registrationHTML = `
                <div class="top-view">
                    <div class="encabezado">
                        <div class="titulo-back">
                            <p class="titulo">Registro</p>
                        </div>
                        <div class="botones-container">
                            <button class="btn-registrar-form btn trans"><i class="bx bx-notepad"></i> Registrar</button>
                        </div>
                    </div>
                </div>
                <div class="contenido">
                <p class="subtitulo">Producto</p>
                    <div class="entrada">
                        <i class="bx bx-box"></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" autocomplete="off" placeholder=" "required>
                        </div>
                    </div>
                    <div class="sugerencias" id="productos-list"></div>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class="ri-scales-line"></i>
                            <div class="input">
                                <p class="detalle">Gramaje</p>
                                <input class="gramaje" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" "required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-spreadsheet'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                    <p class="subtitulo">Procesos</p>
                    <div class="entrada">
                        <i class='bx bx-git-compare'></i>
                        <div class="input">
                            <p class="detalle">Proceso</p>
                            <select class="proceso" required>
                                <option value="" disabled selected></option>
                                <option value="Cernido">Cernido</option>
                                <option value="Seleccion">Selección</option>
                                <option value="Ninguno">Ninguno</option>
                            </select>
                        </div>
                    </div>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-bowl-hot'></i>
                            <div class="input">
                                <p class="detalle">Microondas</p>
                                <select class="select" required>
                                    <option value="" disabled selected></option>
                                    <option value="Si">Si</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>
                        <div class="entrada" style="display:none">
                            <i class='bx bx-time'></i>
                            <div class="input">
                                <p class="detalle">Tiempo</p>
                                <input class="microondas" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                    <p class="subtitulo">Acabado</p>
                    <div class="entrada">
                        <i class='bx bxs-cube-alt'></i>
                        <div class="input">
                            <p class="detalle">Envases terminados</p>
                            <input class="envasados" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-calendar'></i>
                        <div class="input">
                            <p class="detalle">Fecha de vencimiento</p>
                            <input class="vencimiento" type="month" placeholder=" " required>
                        </div>
                    </div>
                </div>
            `;

    view.innerHTML = registrationHTML;
    evetosFormularioProduccion();
    configuracionesEntrada();
}
function evetosFormularioProduccion() {
    const selectMicroondas = document.querySelector('.select');
    const entradaTiempo = document.querySelector('.microondas').closest('.entrada');
    const productoInput = document.querySelector('.entrada .producto');
    const sugerenciasList = document.querySelector('#productos-list');
    const gramajeInput = document.querySelector('.entrada .gramaje');
    const registrar = document.querySelectorAll('.btn-registrar-form');

    entradaTiempo.style.display = 'none';

    selectMicroondas.addEventListener('change', () => {
        if (selectMicroondas.value === 'Si') {
            entradaTiempo.style.display = 'flex';
            entradaTiempo.querySelector('.microondas').focus();
        } else {
            entradaTiempo.style.display = 'none';
        }
    });
    productoInput.addEventListener('input', (e) => {
        const valor = normalizarTexto(e.target.value);

        sugerenciasList.innerHTML = '';

        if (valor) {
            const sugerencias = productosGlobal.filter(p =>
                normalizarTexto(p.producto + p.gramos).includes(valor)
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
    registrar.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Get all form values
            const producto = productoInput.value.trim();
            const idProducto = window.idPro;
            const lote = document.querySelector('.entrada .lote').value; // Fixed selector
            const gramos = gramajeInput.value;
            const proceso = document.querySelector('.proceso').value;
            const microondas = selectMicroondas.value;
            const tiempo = document.querySelector('.microondas').value;
            const envasados = document.querySelector('.envasados').value;
            const vencimiento = document.querySelector('.vencimiento').value;

            // Individual field validations
            if (!producto || !gramos || !lote || !proceso || !microondas || !envasados || !vencimiento) {
                mostrarNotificacion('Todos los campos son obligatorios');
                return;
            }

            // Validate product exists
            const productoExiste = productosGlobal.some(p =>
                normalizarTexto(p.producto) === normalizarTexto(producto)
            );

            if (!productoExiste) {
                mostrarNotificacion('El producto no existe en la base de datos');
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch('/registrar-produccion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idProducto,
                        producto,
                        lote,
                        gramos,
                        proceso,
                        microondas,
                        tiempo: microondas === 'No' ? 'No' : tiempo,
                        envasados,
                        vencimiento
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Limpiar todos los inputs
                    document.querySelector('.producto').value = '';
                    document.querySelector('.lote').value = '';
                    document.querySelector('.gramaje').value = '';
                    document.querySelector('.proceso').value = '';
                    document.querySelector('.select').value = '';
                    document.querySelector('.microondas').value = '';
                    document.querySelector('.envasados').value = '';
                    document.querySelector('.vencimiento').value = '';

                    // Ocultar campo de tiempo microondas
                    document.querySelector('.microondas').closest('.entrada').style.display = 'none';

                    // Limpiar sugerencias
                    document.querySelector('#productos-list').innerHTML = '';
                    document.querySelector('#productos-list').style.display = 'none';

                    // Limpiar id producto global
                    window.idPro = '';

                    // Mostrar notificación
                    mostrarNotificacion('Producción registrada correctamente', { tipo: 'exito', duracion: 2000 });

                    // Enfocar el primer campo
                    document.querySelector('.producto').focus();

                } else {
                    throw new Error(data.error || 'Error al registrar la producción');
                }
            } catch (error) {
                console.error('Error en registro:', error);
                mostrarNotificacion(`Error: ${error.message}`, { tipo: 'error' });
            } finally {
                ocultarCarga();
            }
        });
    });
}