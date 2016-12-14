#!/usr/bin/env node
"use strict";
const program = require('commander'),
  app = require("../index.js"),
  fs = require("fs"),
  path = require('path'),
  winston = require('winston'),
  recursive = require('recursive-readdir'),
  winstonConfigurator = require('../winstonConfigurator');

//noinspection JSCheckFunctionSignatures
program
  .version('0.1.0')
  .option('-d, --directory [directory]', 'The input [directory].')
  .parse(process.argv);

if (!program.directory) {
  winston.error("No directory was given!");
  process.exit();
}


winstonConfigurator(program.directory);

winston.info("Welcome to npm package publisher.");


recursive(program.directory, ['*.log', '*.json'], function (err, files) {
  files = files.map(file => {
      return {name : parseName(file), location: file
    }
  });

  app(files, program);
});

function parseName(file) {
  return file.substring(file.lastIndexOf('\\') + 1, file.lastIndexOf('.'));
}


