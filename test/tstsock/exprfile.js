var express = require('express');
var yargs = require('yargs');
var util = require('util');
var tracelog = require('./lib/tracelog');
var path = require('path');
var filehdl = require('./expr_filedir');
module.exports = express();
var app = module.exports;
var newapp = express();
var args = yargs.usage(util.format('Usage %s [OPTIONS]', process.argv[1]))
    .option('verbose', {
        count: true,
        description: 'log level 0 for error 1 for warn 2 for info 3 for debug 4 for trace',
        default: -1,
        alias: 'v'
    })
    .option('noconsole', {
        boolean: true,
        description: 'set no console output for log',
        default: false,
        alias: 'N'
    })
    .help('h')
    .alias('h', 'help')
    .option('appendlog', {
        array: true,
        description: 'log file that append',
        default: [],
        alias: 'A'
    })
    .option('createlog', {
        array: true,
        description: 'log file that created',
        default: [],
        alias: 'C'
    })
    .option('path', {
        string: true,
        description: 'path that map into server root',
        default: __dirname,
        alias: 'P'
    })
    .option('port', {
        number: true,
        description: 'port to listen one',
        default: 9000,
        alias: 'p'
    })
    .option('format', {
        string: true,
        description: 'log format',
        default: '<{{title}}>:{{file}}:{{line}} {{message}}\n',
        alias: 'F'
    }).argv;

var directory = args.path;
var lport = args.port;
var logopt = {};
var jsdir = __dirname;
var indexejs = jsdir + path.sep + 'index.ejs';

if (args.verbose >= 4) {
    logopt.level = 'trace';
} else if (args.verbose >= 3) {
    logopt.level = 'debug';
} else if (args.verbose >= 2) {
    logopt.level = 'info';
} else if (args.verbose >= 1) {
    logopt.level = 'warn';
} else {
    logopt.level = 'error';
}

if (args.C.length > 0) {
    logopt.files = args.C;
}

if (args.A.length > 0) {
    logopt.appendfiles = args.A;
}
if (args.noconsole) {
    logopt.noconsole = true;
}

logopt.format = args.format;
tracelog.Init(logopt);


process.on('SIGINT', function () {
    'use strict';
    tracelog.warn('caught sig int');
    tracelog.finish(function (err) {
        if (err) {
            console.error('on finish error (%s)', err);
            return;
        }
        process.exit(0);
    });
});

process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s)', err);
    tracelog.finish(function (err) {
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
var init_base_handle = function (req, res, next) {
    'use strict';
    req = filehdl.init_get_file(jsdir, req, lport, indexejs);
    res = res;
    next();
};

app.use(init_file_handle);
app.use(filehdl.get_request);
app.use(filehdl.put_file);
newapp.use(init_base_handle);
newapp.use(filehdl.get_request);


app.listen(lport);
newapp.listen(lport + 1);
tracelog.trace('listen (%s) on (%d) with indexejs (%s)', directory, lport, indexejs);