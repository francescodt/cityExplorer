'use strict';

const superagent = require('superagent');

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

 module.exports = trailHandler;