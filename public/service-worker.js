const CACHE_NAME = 'TotalProd-v1';
const CACHE_RUNTIME = 'TotalProd-runtime-v1';

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
    '/js/auth.js',
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
    'https://cdn.jsdelivr.net/npm/boxicons@2.0.7/css/boxicons.min.css',
    'https://cdn.jsdelivr.net/npm/boxicons@2.0.7/fonts/boxicons.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
];

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = ['/', '/login'];

// INSTALACIÓN: Cachea recursos críticos solamente
self.addEventListener('install', event => {
    console.log('Service Worker instalándose...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            console.log('Cacheando recursos del App Shell...');
            
            // Cachear solo recursos estáticos primero
            const staticResources = APP_SHELL.filter(url => 
                url.includes('.css') || 
                url.includes('.js') || 
                url.includes('.png') || 
                url.includes('.webp') || 
                url.includes('.gif') ||
                url.startsWith('https://')
            );
            
            try {
                await cache.addAll(staticResources);
                console.log('Recursos estáticos cacheados');
            } catch (error) {
                console.warn('Error cacheando recursos estáticos:', error);
                // Intentar cachear uno por uno
                for (const url of staticResources) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                        }
                    } catch (err) {
                        console.warn(`No se pudo cachear: ${url}`, err);
                    }
                }
            }
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
            console.log('Service Worker activado');
            return self.clients.claim();
        })
    );
});

// ESTRATEGIA MEJORADA: Network-First para navegación, Cache-First para recursos
self.addEventListener('fetch', event => {
    // Solo interceptar peticiones HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // NO interceptar peticiones que no sean GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                // Siempre responde desde el cache si existe
                return cachedResponse;
            }
            // Si no está en cache, intenta la red y guarda en cache para la próxima vez
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fallback opcional: puedes personalizar para imágenes, etc.
                return new Response('', { status: 404 });
            });
        })
    );
});
