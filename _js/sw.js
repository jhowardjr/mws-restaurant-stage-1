// Referenced https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker and the lessons
const cacheName = 'mws-restaurant-v16';
const dbName = 'resources';
const dbVersion = 2;
const JSONStore = 'json';
const reviewStore = 'reviews';

function createDB() {
    self.idb.open(dbName, dbVersion, function (upgradeDB) {
        switch (upgradeDB.oldVersion) {
            case 0:
                upgradeDB.createObjectStore(JSONStore);
            case 1:
                upgradeDB.createObjectStore(reviewStore);
        }
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

    let resource = event.request.url.split('/').pop();

    event.respondWith(
        caches.open(cacheName).then(function (cache) {
            return cache.match(event.request).then(function (response) {
                return idb.open(dbName, dbVersion).then(function (db) {
                    const tx = db.transaction(JSONStore);

                    return tx.objectStore(JSONStore).get(resource).then((json) => {

                        if (json) {
                            // found in idb
                            return new Response(json);
                        }

                        return response;

                    }).then((response) => {
                        // return from cache or fetch and store
                        return response || fetch(event.request).then(function (response) {
                            const clone = response.clone();
                            if (event.request.method === 'GET') {
                                if (isJSON(response)) {
                                    // use idb api
                                    idb.open(dbName, dbVersion).then(function (db) {

                                        const tx = db.transaction(JSONStore, 'readwrite');

                                        clone.json().then((body) => {
                                            tx.objectStore(JSONStore).put(JSON.stringify(body), resource);
                                        });

                                    });

                                } else {
                                    // use cache api
                                    cache.put(event.request, clone);

                                }
                                
                            }

                            return response;

                        });
                    });
                });
            });
        })
    );
});

const isJSON = (response) => {
    const contentType = response.headers.get('Content-Type');
    return contentType && contentType.startsWith('application/json');
}