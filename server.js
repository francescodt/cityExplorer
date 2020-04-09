'use strict';

// Load Environment Variables from the .env file
const dotenv = require('dotenv')
dotenv.config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const PORT = process.env.PORT || 3003;
const app = express();

app.use(cors()); // Middleware

app.get('/', (request, response) => {
  response.send('City Explorer Goes Here');
});

app.get('/bad', (request, response) => {
  throw new Error('oops');
});


// Add /location route
app.get('/location', locationHandler);


// Route Handler: location
function locationHandler(request, response) {
  const city = request.query.city;
  const url = 'https://us1.locationiq.com/v1/search.php';

  superagent.get(url)
    .query({
      key: process.env.GEO_KEY,
      q: city, 
      format: 'json'
    })
    .then(locationResponse => {
      let geoData = locationResponse.body;
      const location = new Location(city, geoData);
      response.send(location);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

// Add /weather route
app.get('/weather', weatherHandler);
// Route Handler: weather

function weatherHandler(request, response) {
  const weather = request.query.search_query;
  const url = 'http://api.weatherbit.io/v2.0/current';

  superagent.get(url)
    .query({
      key: process.env.WEATHER_KEY,
      city: weather,
      format: 'json'
    })
    .then(weatherResponse => {
      let weatherData = weatherResponse.body;
      let dailyResults = weatherData.data.map(dailyWeather => {
        return new Weather(dailyWeather);
      })
      response.send(dailyResults);
    })
    .catch( error => {
      console.log(error);
      errorHandler(error, request, response);
    })
}

// Has to happen after everything else
app.use(notFoundHandler);
// Has to happen after the error might have occurred
app.use(errorHandler); // Error Middleware

// Helper Functions

function errorHandler(error, request, response, next) {
  console.log(error);
  response.status(500).json({
    error: true,
    message: error.message,
  });
}

function notFoundHandler(request, response) {
  response.status(404).json({
    notFound: true,
  });
}

function Location(city, geoData) {
  this.search_query = city; // "cedar rapids"
  this.formatted_query = geoData[0].display_name; // "Cedar Rapids, Iowa"
  this.latitude = parseFloat(geoData[0].lat);
  this.longitude = parseFloat(geoData[0].lon);
}

// Weather
function Weather(weatherData) {
  this.forecast = weatherData.summary;
  this.time = new Date(weatherData.time * 1000).toDateString();
}

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));