"use strict";
const winston = require('winston'),
  Promise = require('bluebird'),
  jsonfile = Promise.promisifyAll(require('jsonfile'));

var deleteFrom = function (obj, properties) {
  return new Promise(resolve => {
    if (obj['scripts']){
      properties.forEach(property => delete obj['scripts'][property]);
    }

    resolve(obj);
  })
};

let deleteProperties = function(packageLocation, properties){
    return jsonfile.readFileAsync(packageLocation)
    .then(obj => deleteFrom(obj, properties))
    .then(obj => jsonfile.writeFileAsync(packageLocation, obj))
  };

module.exports = deleteProperties;
