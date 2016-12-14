"use strict";
const winston = require('winston'),
  Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs-extra')),
  packagePropertyDeleter = require('./packageJsonPropertyDeleter'),
  path = require('path'),
  publisher = require('./publisher'),
  targz = require('tar.gz'),
  tempDir = path.join(require('os').tmpdir(), 'npmPublisher');

module.exports = function (npmPackages, opts) {

  publisher.addOnPublishedListener(deleteExtractedFolder);

  winston.info("Publishing -> " + npmPackages.map(p => p.name));
  winston.info("Extracting to -> " + tempDir);

  let packagesIterator = npmPackages[Symbol.iterator]();

  function nextPackage() {
    let npmPackage = packagesIterator.next().value;

    if (npmPackage) {
      let extractedPath = path.join(tempDir, npmPackage.name);

      extractPackage(npmPackage, extractedPath)
        .then(() => deletePrepublish(extractedPath))
        .then(() => publisher.queueForPublish(extractedPath))
        .finally(nextPackage);

    } else {
      winston.info("-Finished extracting all packages.");

      publisher.addOnEmptyListener(close);
    }
  }

  function extractPackage(npmPackage, to) {
    return targz().extract(npmPackage.location, to)
      .then(() => {
        winston.info(`-Extracted ${npmPackage.name}`);
      }).catch(err =>{
        winston.error(`Was unable to extract ${npmPackage.name}\n ${err}`)
      })
  }

  function deletePrepublish(location) {
    return packagePropertyDeleter(path.join(location, 'package/package.json'), ['prepublish', 'postpublish']);
  }

  function deleteExtractedFolder(location) {
    return fs.removeAsync(location)
      .then(() => winston.info(`---Deleted ${location}`))
  }

  function close() {
    winston.info("Finished publishing.");
    winston.info("GoodBye.");
    process.exit();
  }

  nextPackage();
};
