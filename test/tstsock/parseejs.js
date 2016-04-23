var ejs = require('ejs');
var fs = require('fs');
var html;
var content;
var ejsfile;
var jsonfile;
var yargs = require('yargs');
var util = require('util');

var args = yargs.usage(util.format('Usage %s [OPTIONS]', process.argv[1]))
    .default('e', 'index.ejs')
    .alias('e', 'ejs')
    .default('j', 'content.json')
    .alias('j', 'json')
    .help('h')
    .alias('h', 'help')
    .argv;

ejsfile = args.ejs;
jsonfile = args.json;

fs.readFile(jsonfile, 'utf-8', function (err, data1) {
    'use strict';
    if (err) {
        throw err;
    }
    content = JSON.parse(data1);
    fs.readFile(ejsfile, 'utf-8', function (err, data2) {
        if (err) {
            throw err;
        }

        html = ejs.render(data2, content);
        console.log(html);
    });
});