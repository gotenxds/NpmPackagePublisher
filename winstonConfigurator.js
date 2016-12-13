"use strict";
let winston = require('winston');

module.exports = function(output){
  winston.add(winston.transports.File, {
    level:'error',
    filename:`${output}\errorLog.log`
  });

  winston.cli();
};
