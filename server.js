'use strict';

// Load Environment Variables from the .env file
const dotenv = require('dotenv')
dotenv.config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

//DB connection setup
if (!process.env.DATABASE_URL) 
  { throw 'Missing DATABASE_URL'};

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });

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


// Add routes and require it
const weatherHandler = require('./modules/weather');
const trailHandler = require('./modules/trails');



app.get('/weather', weatherHandler);
app.get('/trails', trailHandler);
app.get('/location', locationHandler);

app.use(notFoundHandler);
app.use(errorHandler); // Error Middleware

function setLocationInCache (city, location) {
  const {search_query, formatted_query, latitude, longitude} = location;
  const SQL = `
  INSERT INTO locations (search_query, formatted_query, latitude, longitude) 
  VALUES ($1, $2, $3, $4) 
  RETURNING *
  `;
  const parameters = [search_query, formatted_query, latitude, longitude];
  
  return client.query(SQL, parameters)
    .then(results => {
      console.log(results)
    })
    .catch(err => {
      console.log(err);
    });
};

function getLocationFromCache(city) {
  const SQL = `
  Select *
  FROM locations
  WHERE search_query = $1
  LIMIT 1
  `;
  
  let parameters = [city];
   return client.query(SQL, parameters)
}

// Route Handler: location
function locationHandler(request, response) {
  const city = request.query.city;

  getLocationFromCache(city)
    .then(result => {
      let {rowCount, rows } = result;
      if (rowCount > 0) {
        response.send(rows[0])
      } else {
        return getLocationFromApi(city, response);
      }
    })
}

function getLocationFromApi(city, response) {
  const url = 'https://us1.locationiq.com/v1/search.php';

  return superagent.get(url)
    .query({
      key: process.env.GEO_KEY,
      q: city, 
      format: 'json'
    })
    .then(locationResponse => {
      let geoData = locationResponse.body;
      const location = new Location(city, geoData);
      
      setLocationInCache(city, location)
        .then(() => {
          return response.send(location);
        });
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}



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


//Client connect
client.connect()
  .then(() => {
    console.log('Database connected.');
    app.listen(PORT, () => console.log(`Listening on ${PORT}`));
  })
  .catch(error => {
    throw `Something went wrong: ${error}`;
  });