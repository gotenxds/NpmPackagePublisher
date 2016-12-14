"use strict";
const winston = require('winston'),
  os = require('os'),
  spawn = require('cross-spawn'),
  Promise = require('bluebird'),
  path = require('path'),
  Deque = require("collections/deque");

const maxPublishOperations = os.cpus().length + 1;
let packagesToPublish = new Deque();
let currentlyPublishing = 0;
let onPublishedListeners = [];
let onEmptyListeners = [];

packagesToPublish.addRangeChangeListener(onDequeChange);

let queueForPublish = function (npmPackageLocation) {
  packagesToPublish.push(npmPackageLocation);
};

let addOnPublishedListener = function (listener) {
  onPublishedListeners.push(listener);
};

let addOnEmptyListener = function (listener) {
  onEmptyListeners.push(listener);
};

function onDequeChange() {
  if (currentlyPublishing < maxPublishOperations && packagesToPublish.length !== 0) {
    currentlyPublishing++;

    publish(packagesToPublish.shift())
      .then(location => {
        currentlyPublishing--;

        fireOnPublishedEvent(location);
      })
      .then(checkEmptyness)
      .then(onDequeChange);
  }
}

function publish(location) {
  return new Promise(resolve => {
    let packageLocation = path.join(location, 'package/');

    let child = spawn('npm', ['publish', packageLocation], {stdio: 'inherit'});

    child.on('close', () => resolve(location));
  })
}

function fireOnPublishedEvent(location) {
  onPublishedListeners.forEach(listener => listener(location));
}

function checkEmptyness() {
  if (packagesToPublish.length === 0 && currentlyPublishing === 0) {
    fireOnEmptyEvent();
  }
}

function fireOnEmptyEvent() {
  onEmptyListeners.forEach(listener => listener());
}


module.exports = {queueForPublish: queueForPublish, addOnPublishedListener: addOnPublishedListener, addOnEmptyListener:addOnEmptyListener};
