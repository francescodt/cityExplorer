'use strict';

// Load Environment Variables from the .env file
const dotenv = require('dotenv')
dotenv.config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Application Setup
const PORT = process.env.PORT || 3003;
const app = express();

if (!process.env.DATABASE_URL) {
  throw 'Missing DATABASE_URL';
}

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {throw err; });

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
  const latitude = request.query.latitude;
  const longitude = request.query.longitude;
  const weather = request.query.search_query;
  const url = 'https://api.weatherbit.io/v2.0/forecast/daily';

  superagent.get(url)
    .query({
      lat: latitude,
      lon: longitude,
      key: process.env.WEATHER_KEY,
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

app.get('/trails', trailHandler);

function trailHandler(request, response) {
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  const url = 'https://www.hikingproject.com/data/get-trails';

  superagent(url)
  .query({
    key: process.env.TRAIL_KEY,
    lat: lat,
    lon: lon,
    format: 'json'
  })
  .then( trailsResponse => {
    let trailsData = trailsResponse.body;
    let trailsResults = trailsData.trails.map(allTrails => {
      return new Trails(allTrails);
    })
    response.send(trailsResults);
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
  this.forecast = weatherData.weather.description;
  this.time = new Date(weatherData.valid_date).toDateString();
} //this.forecast = weatherData.summary;
// this.time = new Date(weatherData.time * 1000).toDateString();

function Trails(trailsData) {
  this.name = trailsData.name;
  this.location = trailsData.location;
  this.length = trailsData.length;
  this.stars = trailsData.stars;
  this.starVotes = trailsData.starVotes;
  this.summary = trailsData.summary;
  this.trail_url = trailsData.url;
  this.conditions = trailsData.conditionDetails;
  this.condition_date = new Date(trailsData.conditionDate).toDateString();
}


// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));