// Referenced https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker and the lessons
var cacheName = 'mws-restaurant-v12';

function createDB() {
    idb.open('responses', 1, function (upgradeDB) {
        // TODO: CREATE TABLES
    });
}

self.addEventListener('activate', function (event) {
    event.waitUntil(
        createDB()
    );
});

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(
                [
                    '/',
                    'index.html',
                    'restaurant.html',
                    '/css/styles.css',
                    '/js/main.min.js',
                    '/js/restaurant_info.min.js'
                ]
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.open(cacheName).then(function (cache) {
            return cache.match(event.request).then(function (response) {
                return response || fetch(event.request).then(function (response) {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        })
    );
});