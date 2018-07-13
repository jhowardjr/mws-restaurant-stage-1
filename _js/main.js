let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
  DBHelper.postReviews();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1Ijoiamhvd2FyZGpyIiwiYSI6ImNqamo1dGRldTAwc2EzcG1wMGtxaGo2YmwifQ.B5-_5SqTfifNDritYACPUg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');

  // Referenced https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
  let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        let lazyImage = entry.target;
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.srcset = lazyImage.dataset.srcset;
        lazyImageObserver.unobserve(lazyImage);
      }
    });
  });

  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant, lazyImageObserver));
  });

  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant, observer) => {
  const li = document.createElement('li');

  const icon = document.createElement('i');
  let favoriteClassname = 'far';

  if (restaurant.is_favorite === 'true' || restaurant.is_favorite === true) {
    favoriteClassname = 'fas';
  }

  icon.className = `${favoriteClassname} fa-star fa-2x`;

  const button = document.createElement('button');
  button.className = 'favorite-button';
  button.setAttribute('aria-label', `Make ${restaurant.name} a favorite.`);
  button.onclick = (e) => {
    const isUnselected = icon.classList.contains('far');

    DBHelper.markFavoriteRestaurant(restaurant.id, isUnselected).then((response) => {
      if (isUnselected) {
        icon.classList.replace('far', 'fas');
      } else {
        icon.classList.replace('fas', 'far');
      }
      DBHelper.clearRestaurants();
    });
  };

  button.append(icon);

  li.append(button);

  const image = document.createElement('img');
  // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.className = 'restaurant-img';

  const viewportMap = [{
      media: '(max-width: 320px)',
      suffix: '_280.jpg',
      size: '280w',
      slot: '236px'
    },
    {
      media: '(min-width: 320px)',
      suffix: '_335.jpg',
      size: '335w',
      slot: '291px'
    },
    {
      media: '(min-width: 375px)',
      suffix: '_385.jpg',
      size: '385w',
      slot: '341px'
    },
    {
      media: '(min-width: 425px)',
      suffix: '_432.jpg',
      size: '432w',
      slot: '290px'
    },
    {
      media: '(min-width: 768px)',
      suffix: '_432.jpg',
      size: '432w',
      slot: '290px'
    }
  ];

  DBHelper.generateSrcset(restaurant, viewportMap, image);

  observer.observe(image);
  li.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const label = document.createElement('div');
  label.id = `restaurant-label-${restaurant.id}`;
  label.hidden = true;
  label.innerHTML = `View details about ${restaurant.name}`;
  li.append(label)

  const more = document.createElement('a');
  more.innerHTML = '<span aria-hidden="true">View Details</span>';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-labelledby', `restaurant-label-${restaurant.id}`);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);

    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}