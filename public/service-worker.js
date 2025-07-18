const CACHE_NAME = 'TotalProd-v3';
const CACHE_RUNTIME = 'TotalProd-runtime-v2';

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

// INSTALACIÓN: Cachea todo el APP_SHELL inmediatamente
self.addEventListener('install', event => {
    console.log('Service Worker instalándose...');
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            console.log('Cacheando recursos del App Shell...');

            // Cachear todos los recursos de forma paralela para mayor velocidad
            const cachePromises = APP_SHELL.map(async url => {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        return cache.put(url, response);
                    }
                    console.warn(`Recurso no disponible: ${url}`);
                } catch (error) {
                    console.warn(`Error al cachear: ${url}`, error);
                }
            });

            await Promise.allSettled(cachePromises);
            console.log('App Shell cacheado completamente');
        })
    );
});

// ACTIVACIÓN: Limpia cachés antiguos
self.addEventListener('activate', event => {
    console.log('Service Worker activándose...');

    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== CACHE_RUNTIME)
                    .map(key => {
                        console.log('Eliminando caché antiguo:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('Service Worker activado y controlando todas las pestañas');
            return self.clients.claim();
        })
    );
});

// ESTRATEGIA CACHE-FIRST: Siempre busca primero en caché
self.addEventListener('fetch', event => {
    // Solo interceptar peticiones HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // NO interceptar POST (ni PUT, DELETE, etc.)
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        cacheFirst(event.request)
    );
});
// FUNCIÓN CACHE-FIRST: Prioriza siempre el caché
async function cacheFirst(request) {
    try {
        // 1. SIEMPRE buscar primero en caché
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('Servido desde caché:', request.url);

            // En segundo plano, actualizar el caché si hay internet
            updateCacheInBackground(request);

            return cachedResponse;
        }

        // 2. Si no está en caché, intentar obtener de la red
        console.log('No encontrado en caché, obteniendo de red:', request.url);
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cachear la respuesta para futuras peticiones
            await cacheResponse(request, networkResponse.clone());
            console.log('Nuevo recurso cacheado:', request.url);
        }

        return networkResponse;

    } catch (error) {
        console.log('Error de red, buscando en caché:', request.url);

        // 3. Si falla la red, buscar en caché como fallback
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // 4. Si no hay caché ni red, devolver página offline
        return getOfflinePage(request);
    }
}

// ACTUALIZAR CACHÉ EN SEGUNDO PLANO
async function updateCacheInBackground(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cacheResponse(request, response);
            console.log('Caché actualizado en segundo plano:', request.url);
        }
    } catch (error) {
        // Ignorar errores de red en segundo plano
        console.log('No se pudo actualizar caché en segundo plano:', request.url);
    }
}

// CACHEAR RESPUESTA
async function cacheResponse(request, response) {
    const cache = await caches.open(CACHE_RUNTIME);
    return cache.put(request, response);
}

// PÁGINA OFFLINE DE FALLBACK
async function getOfflinePage(request) {
    // Para navegación, devolver la página principal desde caché
    if (request.mode === 'navigate') {
        const cachedPage = await caches.match('/') || await caches.match('/dashboard');
        if (cachedPage) {
            return cachedPage;
        }
    }

    // Para otros recursos, devolver respuesta offline
    return new Response('Recurso no disponible offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

// MANEJAR ACTUALIZACIONES DEL SERVICE WORKER
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// SINCRONIZACIÓN EN SEGUNDO PLANO (opcional)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Sincronización en segundo plano activada');
        // Aquí puedes agregar lógica para sincronizar datos
    }
});

console.log('Service Worker cargado con estrategia Cache-First');