const dbName = 'resources';
const dbVersion = 2;
const JSONStore = 'json';
const reviewStore = 'reviews';

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL for resturants.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Database URL for reviews.
   */
  static get DATABASE_URL_REVIEWS() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Mark restaurant as favorite
   */
  static markFavoriteRestaurant(id, isFavorite = false) {
    return fetch(
      `${DBHelper.DATABASE_URL}/${id}/?is_favorite=${isFavorite}`, {
        method: 'PUT'
      }
    ).then(response => response.json());
  }

  /**
   * Submit a restaurant review
   */
  static submitRestaurantReview(review) {

    return fetch(
      `${DBHelper.DATABASE_URL_REVIEWS}`, {
        method: 'POST',
        body: review
      }
    ).then(response => response.json());
  }

  /**
   * Post reviews when page is back online.
   */
  static postReviews() {
    window.addEventListener('load', () => {
      window.addEventListener('online', () => {
        self.idb.open(dbName, dbVersion).then(function (db) {
          const tx = db.transaction(reviewStore, 'readwrite');
          tx.objectStore(reviewStore).getAll().then(reviews => {
            for (const review of reviews) {
              DBHelper.submitRestaurantReview(review).then(_ => {
                const tx = db.transaction(reviewStore, 'readwrite');
                tx.objectStore(reviewStore).delete(btoa(review));
                return tx.complete;
              });
            }
          });
        });
      })
    });
  }

  /**
   * Store restaurants reviews offline in idb.
   */
  static storeOffline(review) {
    self.idb.open(dbName, dbVersion).then(function (db) {

      const tx = db.transaction(reviewStore, "readwrite");
      const json = JSON.stringify(review);
      tx.objectStore(reviewStore).put(json, btoa(json));
      return tx.complete;
    });
  }

  /**
   * Clear restaurants reviews JSON in idb.
   */
  static updateReviews(id, review) {

    self.idb.open(dbName, dbVersion).then(function (db) {

      const tx = db.transaction(JSONStore, 'readwrite');
      const store = tx.objectStore(JSONStore);

      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        if (cursor.key.includes(`restaurant_id=${id}`)) {
          const tx = db.transaction(JSONStore, 'readwrite');
          tx.objectStore(JSONStore).put(review, cursor.key);
        }

        cursor.continue();
      });
    });
  }

  /**
   * Clear restaurants JSON in idb.
   */
  static clearRestaurants() {
    self.idb.open(dbName, dbVersion).then(function (db) {
      const tx = db.transaction(JSONStore, "readwrite");
      tx.objectStore(JSONStore).delete('restaurants');
      return tx.complete;
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurants = JSON.parse(xhr.responseText);
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    return fetch(
      `${DBHelper.DATABASE_URL}/${id}`, {
        method: 'GET'
      }
    ).then(response => response.json()).then(restaurant => {

      if (restaurant) { // Got the restaurant
        callback(null, restaurant);
      } else { // Restaurant does not exist in the database
        callback('Restaurant does not exist', null);
      }
    }).catch(error => {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants reviews by id.
   */
  static fecthRestaurantReviewsById(id) {
    return fetch(
      `${DBHelper.DATABASE_URL_REVIEWS}/?restaurant_id=${id}`, {
        method: 'GET'
      }
    ).then(response => response.json());
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Restaurant srcset URL.
   */
  static srcsetUrlForRestaurant(restaurant, suffix, size) {
    return (`/img/scaled/${restaurant.id}${suffix} ${size}`);
  }

  /**
   * Restaurant srcset.
   */
  static generateSrcset(restaurant, viewportMap, image) {
    let srcsets = [];
    let sizes = [];

    for (const viewport of viewportMap) {
      const size = DBHelper.sizeAttribute(viewport.media, viewport.slot);
      const srcset = DBHelper.srcsetUrlForRestaurant(restaurant, viewport.suffix, viewport.size);
      srcsets.push(srcset)
      sizes.push(size)
    }

    image.alt = restaurant.name;
    image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
    image.setAttribute('data-srcset', srcsets.join());
    image.sizes = sizes.join();
  }

  /**
   * Restaurant size attribute.
   */
  static sizeAttribute(media, slot) {
    return (`${media} ${slot}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    })
    marker.addTo(newMap);
    return marker;
  }

}