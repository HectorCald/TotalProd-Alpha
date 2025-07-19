const CACHE_NAME = 'TotalProd-v9';
const CACHE_RUNTIME = 'TotalProd-runtime-v2';

const APP_SHELL = [
    '/',
    '/login',
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
    '/js/auth.js', // Nuevo: manejo de autenticación
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

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = ['/', '/login'];

// INSTALACIÓN: Cachea todo el APP_SHELL inmediatamente
self.addEventListener('install', event => {
    console.log('Service Worker instalándose...');
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            console.log('Cacheando recursos del App Shell...');

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

// ESTRATEGIA CACHE-FIRST CON MANEJO DE AUTENTICACIÓN
self.addEventListener('fetch', event => {
    // Solo interceptar peticiones HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // NO interceptar POST, PUT, DELETE (APIs de autenticación)
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        cacheFirstWithAuth(event.request)
    );
});

// FUNCIÓN CACHE-FIRST CON VALIDACIÓN DE AUTENTICACIÓN
async function cacheFirstWithAuth(request) {
    try {
        // 1. SIEMPRE buscar primero en caché para recursos estáticos
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('Servido desde caché:', request.url);

            // Para navegación, verificar autenticación antes de servir
            if (request.mode === 'navigate') {
                return handleNavigation(request, cachedResponse);
            }

            // Para recursos estáticos, actualizar caché en segundo plano
            updateCacheInBackground(request);
            return cachedResponse;
        }

        // 2. Si no está en caché, intentar obtener de la red
        console.log('No encontrado en caché, obteniendo de red:', request.url);
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            await cacheResponse(request, networkResponse.clone());
            console.log('Nuevo recurso cacheado:', request.url);
        }

        return networkResponse;

    } catch (error) {
        console.log('Error de red, manejando offline:', request.url);
        return handleOfflineNavigation(request);
    }
}

// MANEJAR NAVEGACIÓN CON AUTENTICACIÓN
async function handleNavigation(request, cachedResponse) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Rutas públicas siempre se sirven desde caché
    if (PUBLIC_ROUTES.includes(pathname)) {
        return cachedResponse;
    }

    // Para rutas protegidas, verificar autenticación
    // Nota: Esta verificación se debe hacer en el cliente también
    return cachedResponse; // Por ahora servimos desde caché
}

// FUNCIÓN MEJORADA PARA MANEJAR NAVEGACIÓN CON TU SISTEMA DE COOKIES
async function handleOfflineNavigation(request) {
    if (request.mode === 'navigate') {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // Intentar servir la página solicitada desde caché
        let cachedPage = await caches.match(pathname);
        
        if (cachedPage) {
            return cachedPage;
        }

        // Si no está en caché, servir según la ruta
        if (pathname === '/') {
            // Para la ruta raíz, siempre servir desde caché (tu login)
            cachedPage = await caches.match('/');
        } else if (pathname === '/dashboard' || pathname === '/dashboard_otro') {
            // Para dashboards, servir desde caché
            cachedPage = await caches.match(pathname) || await caches.match('/dashboard');
        }

        return cachedPage || getOfflinePage(request);
    }

    return getOfflinePage(request);
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
    if (request.mode === 'navigate') {
        const cachedPage = await caches.match('/') || await caches.match('/login');
        if (cachedPage) {
            return cachedPage;
        }
    }

    return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
            <title>Sin Conexión - TotalProd</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .offline { color: #666; }
            </style>
        </head>
        <body>
            <div class="offline">
                <h2>Sin conexión a internet</h2>
                <p>Por favor, verifica tu conexión e intenta nuevamente.</p>
                <button onclick="window.location.reload()">Reintentar</button>
            </div>
        </body>
        </html>`,
        {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        }
    );
}

// MANEJAR ACTUALIZACIONES DEL SERVICE WORKER
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// SINCRONIZACIÓN EN SEGUNDO PLANO
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Sincronización en segundo plano activada');
    }
});

console.log('Service Worker cargado con estrategia Cache-First y manejo de autenticación');