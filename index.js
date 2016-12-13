"use strict";
const winston = require('winston'),
  os = require('os'),
  packagePropertyDeleter = require('./packageJsonPropertyDeleter'),
  path = require('path'),
  Promise = require('bluebird'),
  spawn = require('cross-spawn'),
  targz = require('tar.gz');

module.exports = function (npmPackages, opts) {

  winston.info("Publishing -> " + npmPackages.map(p => p.name));

  let packagesIterator = npmPackages[Symbol.iterator]();

  function nextPackage() {
    let npmPackage = packagesIterator.next().value;

    if (npmPackage) {
      let extractedPath = path.join(os.tmpdir(), npmPackage.name);

      extractPackage(npmPackage, extractedPath)
      .then(() => deletePrepublish(extractedPath))
      .then(() => publish(extractedPath))
      .then(nextPackage);
    } else {
      winston.info("Finished publishing.");
      close()
    }
  }

  function extractPackage(npmPackage, to){
    return targz().extract(npmPackage.location, to)
      .then(() => {
        winston.info(`Extracted ${npmPackage.name}`);
      });
  }

  function deletePrepublish(location){
    return packagePropertyDeleter(path.join(location, 'package/package.json'), ['prepublish']);
  }

  function publish(location){
    return new Promise(resolve => {
      location = path.join(location, 'package/');

      var x = spawn.sync('npm', ['publish', location], { stdio: 'inherit' });

      resolve();
    })
  }

  function close() {
    winston.info("GoodBye.");
    process.exit();
  }

  nextPackage();
};
