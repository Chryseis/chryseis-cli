#!/usr/bin/env node

const program = require('commander');
const version = require('../package.json').version;


program
    .version(version)
    .command('init', 'init a react template')
    .command('upload','upload upyun')
    .parse(process.argv);