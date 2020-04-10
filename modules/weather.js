'use strict';

const superagent = require('superagent');

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

// Weather
function Weather(weatherData) {
    this.forecast = weatherData.weather.description;
    this.time = new Date(weatherData.valid_date).toDateString();
  }

module.exports = weatherHandler;