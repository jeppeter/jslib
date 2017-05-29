var express = require('express');
var util = require('util');
var jstracer = require('jstracer');
var path = require('path');
var filehdl = require('./expr_filedir');
module.exports = express();
var app = module.exports;
var newapp = express();
var extargsparse = require('extargsparse');
var parser, args;
var command_line_fmt = `
    {
        "path|P": "%s",
        "port|p": 9000
    }
`;

var command_line = util.format(command_line_fmt, __dirname.replace(/\\/g, '\\\\'));
parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(command_line);
jstracer.init_args(parser);
args = parser.parse_command_line();


var directory = args.path;
var lport = args.port;
var jsdir = __dirname;
var indexejs = jsdir + path.sep + 'index.ejs';

jstracer.set_args(args);


process.on('SIGINT', function () {
    'use strict';
    jstracer.warn('caught sig int');
    jstracer.finish(function (err) {
        if (err) {
            console.error('on finish error (%s)', err);
            return;
        }
        process.exit(0);
    });
});

process.on('uncaughtException', function (err) {
    'use struct';
    jstracer.error('error (%s)', err);
    jstracer.finish(function (err) {
        if (err) {
            console.log('error on (%s)', err);
            return;
        }
        process.exit(4);
    });
});



var init_file_handle = function (req, res, next) {
    'use strict';
    req = filehdl.init_get_file(directory, req, lport, indexejs);
    res = res;
    next();
};

app.use(init_file_handle);
app.get('*', filehdl.get_request);
app.post('*', filehdl.put_file);
app.put('*', filehdl.put_file);
newapp.use(express.static(jsdir));


app.listen(lport);
newapp.listen(lport + 1);
jstracer.trace('listen (%s) on (%d) with indexejs (%s)', directory, lport, indexejs);