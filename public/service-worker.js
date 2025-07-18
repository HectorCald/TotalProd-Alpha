const CACHE_NAME = 'TotalProd-v1';

const APP_SHELL = [
    '/',
    '/dashboard',
    '/css/dashboard.css',
    '/css/login.css',
    '/css/estilos-base.css',
    '/css/styles/botones.css',
    '/css/styles/componentes.css',
    '/css/styles/item.css',
    '/css/styles/screen.css',
    '/css/styles/skeletos.css',
    '/css/styles/textos.css',
    '/css/styles/views.css',
    '/js/dashboard.js',
    '/js/login.js',
    '/js/componentes.js',
    '/js/modules/acopio/almacen-acopio.js',
    '/js/modules/acopio/pedidos-acopio.js',
    '/js/modules/acopio/registros-acopio.js',
    '/js/modules/admin/ajustes.js',
    '/js/modules/admin/catalogos.js',
    '/js/modules/admin/clientes.js',
    '/js/modules/admin/pagina-web.js',
    '/js/modules/admin/pagos.js',
    '/js/modules/admin/personal.js',
    '/js/modules/admin/proveedores.js',
    '/js/modules/almacen/almacen-general.js',
    '/js/modules/almacen/registros-almacen.js',
    '/js/modules/almacen/registros-conteo-almacen.js',
    '/js/modules/dashboard/atajos.js',
    '/js/modules/dashboard/funciones.js',
    '/js/modules/dashboard/notificaciones.js',
    '/js/modules/dashboard/orden-produccion.js',
    '/js/modules/dashboard/perfil.js',
    '/js/modules/produccion/formulario-produccion.js',
    '/js/modules/produccion/mis-registros.js',
    '/js/modules/produccion/registros-produccion.js',
    '/js/modules/produccion/reglas.js',
    '/img/brain-process.gif',
    '/img/data-collection.gif',
    '/img/logo-trans.webp',
    '/img/logotipo-damabrava-1x1.png',
    '/img/Logotipo-damabrava-trans.webp',
    '/img/cabecera-catalogo-trans.webp',
    '/img/fondo-catalogo-trans.webp',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon.png',
    // ICONOS Y FUENTES EXTERNAS
    'https://cdn.jsdelivr.net/npm/boxicons@2.0.7/css/boxicons.min.css',
    'https://cdn.jsdelivr.net/npm/boxicons@2.0.7/fonts/boxicons.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            for (const url of APP_SHELL) {
                try {
                    await cache.add(url);
                } catch (e) {
                    console.warn('No se pudo cachear:', url, e);
                }
            }
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});
