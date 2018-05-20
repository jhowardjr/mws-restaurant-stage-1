var cacheName = 'mws-restaurant-v8';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(
                [
                    '/',
                    'index.html',
                    'restaurant.html',
                    '/data/restaurants.json',
                    '/css/styles.css',
                    '/js/dbhelper.js',
                    '/js/main.js',
                    '/js/restaurant_info.js'
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