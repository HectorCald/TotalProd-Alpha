let configuracionesGlobal = null;

async function obtenerConfiguraciones() {
    try {
        mostrarCargaObtener();
        const response = await fetch('/obtener-configuraciones');
        const data = await response.json();
        if (data.success) {
            configuracionesGlobal = data.configuraciones;
            return data.configuraciones;
        }
    } catch (error) {
        console.error('Error al obtener configuraciones:', error);
        mostrarNotificacion({
            message: 'Error al obtener las configuraciones',
            type: 'error',
            duration: 3500
        });
    } finally {
        ocultarCargaObtener();
    }
}

export async function mostrarConfiguracionesSistema() {
    await obtenerConfiguraciones()
    const view = document.querySelector('.ajustes-cont');

    const initialHTML = `
        <div class="top-view">
            <div class="encabezado">
                <div class="titulo-back">
                    <p class="titulo">Ajustes del sistema</p>
                </div>
                <div class="anuncio-botones">
                    <button class="btn-guardar-config btn blue">
                        <i class='bx bx-save'></i> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
        
        <div class="contenido">
            <p class="subtitulo">Horario de Registro de Producción</p>
            <div class="campo-horizontal">
                <div class="entrada">
                    <i class='bx bx-time'></i>
                    <div class="input">
                        <p class="detalle">Hora Inicio</p>
                        <input type="time" class="hora-inicio" value="${configuracionesGlobal?.horario?.horaInicio || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-time'></i>
                    <div class="input">
                        <p class="detalle">Hora Fin</p>
                        <input type="time" class="hora-fin" value="${configuracionesGlobal?.horario?.horaFin || ''}">
                    </div>
                </div>
            </div>
            <p class="subtitulo">Estado del Sistema</p>
            <div class="estado-selector campo-horizontal">
                <button class="btn-estado btn orange ${configuracionesGlobal?.sistema?.estado === 'Activo' ? 'active' : ''}" data-estado="Activo">
                    <i class='bx bx-check-circle'></i> Activo
                </button>
                <button class="btn-estado btn orange ${configuracionesGlobal?.sistema?.estado === 'Inactivo' ? 'active' : ''}" data-estado="Inactivo">
                    <i class='bx bx-x-circle'></i> Inactivo
                </button>
            </div>
            <div class="info-sistema">
                <i class='bx bx-info-circle'></i>
                <div class="detalle-info">
                    <p>Si has realizado cambios en la configuración. No olvides guardarlos para que se apliquen. los cambios pueden afectar a varios aspectos del sistema.</p>
                </div>
            </div>
        </div>
        
    `;

    view.innerHTML = initialHTML;
    eventosConfiguraciones()
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}

function eventosConfiguraciones() {
    const btnEstados = document.querySelectorAll('.btn-estado');
    const btnGuardar = document.querySelector('.btn-guardar-config');


    btnEstados.forEach(btn => {
        btn.addEventListener('click', () => {
            btnEstados.forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
        });
    });

    btnGuardar.addEventListener('click', async () => {
        const horaInicio = document.querySelector('.hora-inicio').value;
        const horaFin = document.querySelector('.hora-fin').value;
        const estado = document.querySelector('.btn-estado.active').dataset.estado;

        if (!horaInicio || !horaFin) {
            mostrarNotificacion('Debe completar todos los campos de horario');
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-configuraciones', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    horaInicio,
                    horaFin,
                    estado
                })
            });

            const data = await response.json();
            if (data.success) {
                await obtenerConfiguraciones();
                mostrarNotificacion('Ajustes actualizados', {tipo:'exito', duracion:2000} );
            }
        } catch (error) {
            mostrarNotificacion('Error al actualizar ajustes', {tipo:'error'} );
            console.error('Error:', error);
        } finally {
            ocultarCarga();
        }
    });
}