'use strict';

const superagent = require('superagent');


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
  

  function Location(city, geoData) {
    this.search_query = city; // "cedar rapids"
    this.formatted_query = geoData[0].display_name; // "Cedar Rapids, Iowa"
    this.latitude = parseFloat(geoData[0].lat);
    this.longitude = parseFloat(geoData[0].lon);
  }

  module.exports = locationHandler;