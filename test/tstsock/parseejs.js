var ejs = require('ejs');
var fs = require('fs');
var html;
var content;
var ejsfile;
var jsonfile;
//var util = require('util');
var extargsparse = require('extargsparse');

var args, parser;
var command_line = `
    {
        "ejs|e" : "index.ejs",
        "parsejson|j" : "content.json"
    }
`;
parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(command_line);
args = parser.parse_command_line();


ejsfile = args.ejs;
jsonfile = args.parsejson;

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