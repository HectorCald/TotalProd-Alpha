import { cargarAtajos, mostrarAtajoAll, ocultarAtajosAll } from './modules/dashboard/atajos.js'
import { mostrarFunciones, ocultarFunciones } from './modules/dashboard/funciones.js';
import { mostrarPerfil, ocultarPerfil } from './modules/dashboard/perfil.js';
import { mostrarNotificaciones, ocultarNotificaciones } from './modules/dashboard/notificaciones.js';
import { initDB, obtenerLocal, normalizarTexto, mostrarScreen, ocultarScreen, mostrarScreen2, ocultarScreen2, mostrarCarga, ocultarCarga, mostrarNotificacion, ocultarCargaObtener, mostrarCargaObtener, configuracionesEntrada, tienePermiso, actualizarPermisos } from './componentes.js';
import { mostrarClientes } from './modules/admin/clientes.js';
import { mostrarProveedores } from './modules/admin/proveedores.js';
import { mostrarPersonal } from './modules/admin/personal.js';
import { mostrarPagos } from './modules/admin/pagos.js';
import { mostrarDescargaCatalogo } from './modules/admin/catalogos.js';
import { mostrarConfiguracionesSistema } from './modules/admin/ajustes.js';
import { mostrarPaginaWeb } from './modules/admin/pagina-web.js';
import { mostrarVerificacion } from './modules/produccion/registros-produccion.js';
import { mostrarMisRegistros } from './modules/produccion/mis-registros.js';
import { mostrarFormularioProduccion } from './modules/produccion/formulario-produccion.js';
import { mostrarReglas } from './modules/produccion/reglas.js';
import { mostrarAlmacenAcopio } from './modules/acopio/almacen-acopio.js';
import { mostrarPedidos } from './modules/acopio/pedidos-acopio.js';
import { mostrarRegistrosAcopio } from './modules/acopio/registros-acopio.js';
import { mostrarTareas } from './modules/acopio/tareas.js';
import { mostrarMovimientosAlmacen } from './modules/almacen/registros-almacen.js';
import { mostrarRegistrosConteoAlmacen } from './modules/almacen/registros-conteo-almacen.js';
import { mostrarAlmacenGeneral } from './modules/almacen/almacen-general.js';
import { mostrarOrdenProduccion } from './modules/dashboard/orden-produccion.js';
export let usuarioInfo = [];

export const atajosPorRol = {
    'Producción': [
        {
            clase: 'opcion-btn',
            vista: 'formulario-produccion-cont',
            icono: 'fa-file-alt',
            texto: 'Formulario',
            detalle: 'Registros de producción',
            onclick: 'onclick="mostrarFormularioProduccion();"'
        },
        {
            clase: 'opcion-btn',
            vista: 'mis-registros-produccion-cont',
            icono: 'fa-folder-open',
            texto: 'Mis registros',
            detalle: 'Registros de producción',
            onclick: 'onclick="mostrarMisRegistros();"'
        },
    ],
    'Acopio': [
        {
            clase: 'opcion-btn',
            vista: 'almacen-acopio-cont',
            icono: 'fa-warehouse',
            texto: 'Acopio',
            detalle: 'Gestiona acopio',
            onclick: 'onclick="mostrarAlmacenAcopio();"'
        },
        {
            clase: 'opcion-btn',
            vista: 'pedidos-acopio-cont',
            icono: 'fa-receipt',
            texto: 'Pedidos',
            detalle: 'Gestiona los pedidos',
            onclick: 'onclick="mostrarPedidos();"'
        },
        {
            clase: 'opcion-btn',
            vista: 'registros-acopio-cont',
            icono: 'fa-exchange-alt',
            texto: 'Movimientos',
            detalle: 'Registros de acopio',
            onclick: 'onclick="mostrarRegistrosAcopio();"'
        },
        {
            clase: 'opcion-btn',
            vista: 'tareas-acopio-cont',
            icono: 'fa-tasks',
            texto: 'Tareas',
            detalle: 'Gestiona el tiempo en tareas.',
            onclick: 'onclick="mostrarTareas();"'
        },
    ],
    'Almacen': [
        {
            clase: 'opcion-btn',
            vista: 'almacen-general-cont',
            icono: 'fa-warehouse',
            texto: 'Almacen',
            detalle: 'Gestiona el almacen.',
            onclick: 'onclick="mostrarAlmacenGeneral()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'registros-produccion-cont',
            icono: 'fa-industry',
            texto: 'Producción',
            detalle: 'Verifica registros.',
            onclick: 'onclick="mostrarVerificacion()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'registros-almacen-cont',
            icono: 'fa-exchange-alt',
            texto: 'Movimintos',
            detalle: 'Registros de almacen.',
            onclick: 'onclick="mostrarMovimientosAlmacen()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'registros-conteo-almacen-cont',
            icono: 'fa-folder-open',
            texto: 'Conteos',
            detalle: 'Registros de conteos.',
            onclick: 'onclick="mostrarRegistrosConteoAlmacen()"'
        }
    ],
    'Administración': [
        {
            clase: 'opcion-btn',
            vista: 'clientes-cont',
            icono: 'fa-user-circle',
            texto: 'Clientes',
            detalle: 'Gestiona tus clientes',
            onclick: 'onclick="mostrarClientes()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'proveedores-cont',
            icono: 'fa-truck',
            texto: 'Proveedores',
            detalle: 'Gestiona tus proovedores',
            onclick: 'onclick="mostrarProveedores()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'personal-cont',
            icono: 'fa-users',
            texto: 'Personal',
            detalle: 'Gestiona tus empleados',
            onclick: 'onclick="mostrarPersonal()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'pagos-cont',
            icono: 'fa-credit-card',
            texto: 'Pagos',
            detalle: 'Realiza y registra pagos.',
            onclick: 'onclick="mostrarPagos()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'almacen-view',
            icono: 'fa-file-invoice',
            texto: 'Reportes',
            detalle: 'Genera reportes.',
            onclick: 'onclick="mostrarReportes()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'catalogos-cont',
            icono: 'fa-file-pdf',
            texto: 'Catalogos',
            detalle: 'Genera catalagos',
            onclick: 'onclick="mostrarDescargaCatalogo()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'paginaWeb-cont',
            icono: 'fa-globe',
            texto: 'Pagina Web',
            detalle: 'Pagina Web de la empresa',
            onclick: 'onclick="mostrarPaginaWeb()"'
        },
        {
            clase: 'opcion-btn',
            vista: 'reglas-cont',
            icono: 'fa-solid fa-book',
            texto: 'Reglas',
            detalle: 'Todas las reglas para precios.',
            onclick: 'onclick="mostrarReglas();"',
            soloAdmin: true
        },
        {
            clase: 'opcion-btn',
            vista: 'ajustes-cont',
            icono: 'fa-cog',
            texto: 'Ajustes',
            detalle: 'Ajustes del sistema',
            onclick: 'onclick="mostrarConfiguracionesSistema()"'
        },
    ]
};
export const pluginsMenu = {
    'tareasAc': {
        clase: 'opcion-btn',
        vista: 'tareas-acopio-cont',
        icono: 'fa-tasks',
        texto: 'Tareas',
        detalle: 'Gestiona el tiempo en tareas.',
        onclick: 'onclick="mostrarTareas();"'
    },
    'misRegistrosProd': {
        clase: 'opcion-btn',
        vista: 'cuentasProduccion-view',
        icono: 'fa-folder-open',
        texto: 'Mis registros',
        detalle: 'mis-registros-produccion-cont',
        onclick: 'onclick="mostrarMisRegistros();"'
    },
    'reglasPrecios': {
        clase: 'opcion-btn',
        vista: 'reglas-cont',
        icono: 'fa-solid fa-book',
        texto: 'Reglas',
        detalle: 'Todas las reglas para precios.',
        onclick: 'onclick="mostrarReglas();"'
    },
    'verificarRegistros': {
        clase: 'opcion-btn',
        vista: 'registros-produccion-cont',
        icono: 'fa-industry',
        texto: 'Producción',
        detalle: 'Todos los registros de producción.',
        onclick: 'onclick="mostrarVerificacion()"'
    },
    'almAcopio': {
        clase: 'opcion-btn',
        vista: 'almacen-acopio-cont',
        icono: 'fa-warehouse',
        texto: 'Acopio',
        detalle: 'Gestiona el almacen de acopio.',
        onclick: 'onclick="mostrarAlmacenAcopio();"'
    },
    'pedidos': {
        clase: 'opcion-btn',
        vista: 'pedidos-acopio-cont',
        icono: 'fa-receipt',
        texto: 'Pedidos',
        detalle: 'Gestiona todos los pedidos.',
        onclick: 'onclick="mostrarPedidos();"'
    },
    'registrosAcopio': {
        clase: 'opcion-btn',
        vista: 'registros-acopio-cont',
        icono: 'fa-exchange-alt',
        texto: 'Movimientos Acp.',
        detalle: 'Todos los registros de acopio.',
        onclick: 'onclick="mostrarRegistrosAcopio();"'
    },
    'almacenGeneral': {
        clase: 'opcion-btn',
        vista: 'almacen-general-cont',
        icono: 'fa-warehouse',
        texto: 'Almacen',
        detalle: 'Gestiona el almacen general.',
        onclick: 'onclick="mostrarAlmacenGeneral()"'
    },
    'registrosAlmacen': {
        clase: 'opcion-btn',
        vista: 'registros-almacen-cont',
        icono: 'fa-exchange-alt',
        texto: 'Movimientos Alm.',
        detalle: 'Todos los registros de almacen.',
        onclick: 'onclick="mostrarMovimientosAlmacen()"'
    },
    'registrosConteo': {
        clase: 'opcion-btn',
        vista: 'registros-conteo-almacen-cont',
        icono: 'fa-folder-open',
        texto: 'Conteos',
        detalle: 'Todos los registros de conteo.',
        onclick: 'onclick="registrosConteoAlmacen()"'
    },
    'personal': {
        clase: 'opcion-btn',
        vista: 'personal-cont',
        icono: 'fa-users',
        texto: 'Personal',
        detalle: 'Gestiona todo el personal.',
        onclick: 'onclick="mostrarPersonal()"'
    },
    'clientes': {
        clase: 'opcion-btn',
        vista: 'clientes-cont',
        icono: 'fa-user-circle',
        texto: 'Clientes',
        detalle: 'Gestiona todos los clientes.',
        onclick: 'onclick="mostrarClientes()"'
    },
    'proovedores': {
        clase: 'opcion-btn',
        vista: 'proveedores-cont',
        icono: 'fa-truck',
        texto: 'Proovedores',
        detalle: 'Gestiona todos los proovedores.',
        onclick: 'onclick="mostrarProovedores()"'
    },
    'pagos': {
        clase: 'opcion-btn',
        vista: 'pagos.cont',
        icono: 'fa-credit-card',
        texto: 'Pagos',
        detalle: 'Registra pagos en general.',
        onclick: 'onclick="mostrarPagos()"'
    },
    'reportes': {
        clase: 'opcion-btn',
        vista: 'reportes-cont',
        icono: 'fa-file-invoice',
        texto: 'Reportes',
        detalle: 'Genera todos los reportes.',
        onclick: 'onclick="mostrarReportes()"'
    },
    'catalogos': {
        clase: 'opcion-btn',
        vista: 'catalogos-cont',
        icono: 'fa-file-pdf',
        texto: 'Catalogos',
        detalle: 'Genera catalagos segun el precio',
        onclick: 'onclick="mostrarDescargaCatalogo()"'
    },
    'paginaWeb': {
        clase: 'opcion-btn',
        vista: 'paginaWeb-cont',
        icono: 'fa-globe',
        texto: 'Pagina Web',
        detalle: 'Pagina Web de la empresa',
        onclick: 'onclick="mostrarPaginaWeb()"'
    },
    'ajustes': {
        clase: 'opcion-btn',
        vista: 'ajustes-cont',
        icono: 'fa-cog',
        texto: 'Ajustes',
        detalle: 'Ajustes del sistema o/y aplicación',
        onclick: 'onclick="mostrarConfiguracionesSistema()"'
    }
};

const overlay = document.querySelector('.overlay')
async function obtenerUsuarioActual() {
    try {
        mostrarCargaObtener();
        const usuarioGuardado = localStorage.getItem('damabrava_usuario');
        if (usuarioGuardado) {
            ocultarCargaObtener();
        }
            const response = await fetch('/obtener-usuario-actual');
            const data = await response.json();
            (async () => {
            if (data.success) {
                const nombreCompleto = data.usuario.nombre.split(' ');
                usuarioInfo = {
                    id: data.usuario.id,
                    nombre: nombreCompleto[0] || '',
                    apellido: nombreCompleto[1] || '',
                    telefono: data.usuario.telefono,
                    email: data.usuario.email,
                    rol: data.usuario.rol,
                    estado: data.usuario.estado,
                    plugins: data.usuario.plugins,
                    permisos: data.usuario.permisos,
                };
                // Guardar en localStorage después de obtener del servidor
                localStorage.setItem('damabrava_usuario', JSON.stringify(usuarioInfo));
                actualizarPermisos(usuarioInfo);
                return true;
            } else {
                // Si falla el servidor, intentar recuperar del localStorage
                const usuarioGuardado = localStorage.getItem('damabrava_usuario');
                if (usuarioGuardado) {
                    usuarioInfo = JSON.parse(usuarioGuardado);
                    return true;
                }
                return false;
            }
        })();
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        return false;
    }finally{
        ocultarCargaObtener();
    }

}

function ocultarOverlay() {
    overlay.classList.remove('activo');
}
function mostrarOverlay() {
    overlay.classList.add('activo');
}

window.obtenerLocal = obtenerLocal
window.initDB = initDB
window.normalizarTexto = normalizarTexto
window.mostrarScreen = mostrarScreen
window.ocultarScreen = ocultarScreen
window.ocultarScreen2 = ocultarScreen2
window.mostrarScreen2 = mostrarScreen2
window.mostrarCarga = mostrarCarga
window.ocultarCarga = ocultarCarga
window.mostrarNotificacion = mostrarNotificacion
window.ocultarCargaObtener = ocultarCargaObtener
window.mostrarCargaObtener = mostrarCargaObtener
window.configuracionesEntrada = configuracionesEntrada
window.tienePermiso = tienePermiso
window.actualizarPermisos = actualizarPermisos

window.mostrarOverlay = mostrarOverlay
window.ocultarOverlay = ocultarOverlay

window.mostrarPerfil = mostrarPerfil
window.ocultarPerfil = ocultarPerfil

window.mostrarNotificaciones = mostrarNotificaciones
window.ocultarNotificaciones = ocultarNotificaciones

window.mostrarAtajoAll = mostrarAtajoAll
window.ocultarAtajosAll = ocultarAtajosAll

window.mostrarFunciones = mostrarFunciones
window.ocultarFunciones = ocultarFunciones

window.mostrarClientes = mostrarClientes
window.mostrarProveedores = mostrarProveedores
window.mostrarPersonal = mostrarPersonal
window.mostrarPagos = mostrarPagos
window.mostrarDescargaCatalogo = mostrarDescargaCatalogo
window.mostrarConfiguracionesSistema = mostrarConfiguracionesSistema
window.mostrarPaginaWeb = mostrarPaginaWeb

window.mostrarVerificacion = mostrarVerificacion
window.mostrarMisRegistros = mostrarMisRegistros
window.mostrarReglas = mostrarReglas
window.mostrarFormularioProduccion = mostrarFormularioProduccion

window.mostrarAlmacenAcopio = mostrarAlmacenAcopio
window.mostrarPedidos = mostrarPedidos
window.mostrarRegistrosAcopio = mostrarRegistrosAcopio
window.mostrarTareas=mostrarTareas

window.mostrarMovimientosAlmacen=mostrarMovimientosAlmacen
window.mostrarRegistrosConteoAlmacen=mostrarRegistrosConteoAlmacen
window.mostrarAlmacenGeneral=mostrarAlmacenGeneral

window.mostrarOrdenProduccion = mostrarOrdenProduccion;

// Función global para mostrar vista correspondiente
window.mostrarVistaCorrespondiente = function (vista) {
    // Ocultar todas las vistas con transición y limpiar su contenido
    const todasLasVistas = document.querySelectorAll('.view');
    todasLasVistas.forEach(v => {
        v.style.display = 'none';
        v.classList.remove('visible');
        // Limpia el contenido solo si no es la vista que se va a mostrar ni la dashboard
        if (!v.classList.contains(vista) && !v.classList.contains('dashboard')) {
            v.innerHTML = '';
        }
    });
    // Mostrar solo la vista correspondiente con transición
    const vistaCorrespondiente = document.querySelector(`.${vista}`);
    if (vistaCorrespondiente) {
        vistaCorrespondiente.style.display = 'flex';
        setTimeout(() => {
            vistaCorrespondiente.classList.add('visible');
        }, 50);
        ocultarScreen();
        actualizarBotonesFooter();
    } else {
        // Si no encuentra la vista específica, mostrar dashboard como fallback
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.style.display = 'flex';
            setTimeout(() => {
                dashboard.classList.add('visible');
            }, 50);
            actualizarBotonesFooter();
        }
    }
}

function overlayClick() {
    const editarPerfil = document.querySelector('.editar-perfil');
    const funcionesContainer = document.querySelector('.funciones');
    const atajosAllContainer = document.querySelector('.atajos-all')
    overlay.addEventListener('click', () => {
        if (editarPerfil.classList.contains('activo')) {
            ocultarPerfil();
        }
        if (funcionesContainer.classList.contains('activo')) {
            ocultarFunciones();
        }
        if (atajosAllContainer.classList.contains('activo')) {
            ocultarAtajosAll();
        }
    });
}
function activarFooterBtns() {
    const footerBtns = document.querySelectorAll('.footer button');
    footerBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // No procesar botones de funciones y configuración
            if (btn.classList.contains('funcion-btn') || btn.classList.contains('configuracion-btn')) {
                return;
            }

            // Ocultar paneles si están abiertos
            ocultarPerfil();
            ocultarNotificaciones();
            ocultarFunciones();
            ocultarAtajosAll();
            ocultarOverlay();

            // Remover clase activo de todos los botones
            footerBtns.forEach(b => b.classList.remove('activo'));
            // Agregar clase activo al botón presionado
            this.classList.add('activo');

            // Mostrar la vista correspondiente
            if (btn.classList.contains('home-btn')) {
                window.mostrarVistaCorrespondiente('dashboard');
            } else if (btn.classList.contains('orden-btn')) {
                window.mostrarVistaCorrespondiente('ordenes-cont');
                mostrarOrdenProduccion();
            }
        });
    });
}
function actualizarBotonesFooter() {
    const footerBtns = document.querySelectorAll('.footer button');
    const vistasVisibles = document.querySelectorAll('.view[style*="flex"]');

    // Remover activo de todos los botones
    footerBtns.forEach(b => b.classList.remove('activo'));

    // Determinar qué vista está visible y activar el botón correspondiente
    vistasVisibles.forEach(vista => {
        if (vista.classList.contains('dashboard')) {
            document.querySelector('.home-btn').classList.add('activo');
        } else if (vista.classList.contains('ordenes-cont')) {
            document.querySelector('.orden-btn').classList.add('activo');
        } else {
            // Si está en cualquier otra vista (clientes-cont, proveedores-cont, personal-cont, etc.)
            // activar el botón de funciones
            document.querySelector('.funcion-btn').classList.add('activo');
        }
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    obtenerUsuarioActual();
    actualizarPermisos(usuarioInfo)
    overlayClick();
    cargarAtajos();
    activarFooterBtns();
    mostrarVistaCorrespondiente('dashboard')
});