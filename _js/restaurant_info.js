let restaurant;
var map;


/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
  DBHelper.postReviews();
});


/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.fecthRestaurantReviewsById(self.restaurant.id).then(reviews => {
        self.restaurant.reviews = reviews;
        fillReviewsHTML(reviews);
      });
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');

  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {

      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const viewportMap = [{
      media: '(max-width: 320px)',
      suffix: '_280.jpg',
      size: '280w',
      slot: '280px'
    },
    {
      media: '(min-width: 375px)',
      suffix: '_385.jpg',
      size: '385w',
      slot: '385px'
    },
    {
      media: '((min-width: 425px) and (max-width: 767px))',
      suffix: '_640.jpg',
      size: '640w',
      slot: ''
    },
    {
      media: '(min-width: 425px)',
      suffix: '_640.jpg',
      size: '640w',
      slot: '432px'
    }
  ];

  DBHelper.generateSrcset(restaurant, viewportMap, image);
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fill form
  fillReviewForm()
}

/**
 * Create forms for submitting reviews.
 */
const fillReviewForm = () => {

  const form = document.forms.reviews_form;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    const reviews = [{
      restaurant_id: getParameterByName('id'),
      rating: document.querySelector('#star_rating :checked ~ label span').textContent,
      name: formData.get('user_name'),
      comments: formData.get('comments')

    }];

    for (const review of reviews) {
      DBHelper.submitRestaurantReview(JSON.stringify(review)).then((response) => {
        review['createdAt'] = response.createdAt;
        self.restaurant.reviews.push(review);
        DBHelper.updateReviews(review.restaurant_id, JSON.stringify(self.restaurant.reviews));
        return response;
      }).catch(_ => {
        review['createdAt'] = new Date();
        self.restaurant.reviews.push(review);
        DBHelper.updateReviews(review.restaurant_id, JSON.stringify(self.restaurant.reviews));
        DBHelper.storeOffline(review);
      }).finally(_ => {
        fillReviewsHTML([review]);
        form.reset();
      });
    }
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  const caption = document.createElement('caption');
  caption.innerHTML = `${self.restaurant.name}'s Hours of Operation`;

  hours.appendChild(caption)

  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!document.getElementById('reviews-title')) {
    const title = document.createElement('h3');
    title.id = 'reviews-title';
    title.innerHTML = 'Reviews';
    container.appendChild(title);
  }

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');

  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  container.appendChild(ul);

  const form = document.getElementById('reviews_form');

  container.appendChild(form);


}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb-nav');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}