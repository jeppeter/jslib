var yargs = require('yargs');
var util = require('util');
var tracelog = require('./lib/tracelog');
var http = require('http');

var argv = yargs.count('verbose')
    .alias('verbose', 'v')
    .usage(util.format('Usage %s [OPTIONS] file', process.argv[1]))
    .default({
        file: [],
        interactive: 'no'
    })
    .help('h')
    .alias('h', 'help')
    .array('appendfiles')
    .alias('appendfiles', 'A')
    .array('files')
    .alias('files', 'F')
    .alias('i', 'interactive')
    .argv;

//console.log(argv);

var logopt;
logopt = {};
if (argv.verbose >= 4) {
    logopt.level = 'trace';
} else if (argv.verbose >= 3) {
    logopt.level = 'debug';
} else if (argv.verbose >= 2) {
    logopt.level = 'debug';
} else if (argv.verbose >= 1) {
    logopt.level = 'warn';
} else {
    logopt.level = 'error';
}

logopt.files = argv.files;
logopt.appendfiles = argv.appendfiles;
tracelog.Init(logopt);

tracelog.trace('print trace (%d)', argv.verbose);
tracelog.debug('print debug (%d)', argv.verbose);
tracelog.info('print info (%d)', argv.verbose);
tracelog.warn('print warn (%d)', argv.verbose);
tracelog.error('print error (%d)', argv.verbose);

process.on('SIGINT', function () {
    'use strict';
    tracelog.warn('caught sig int');
    tracelog.finish(function (err) {
        if (err) {
            console.log('error on (%s)', err);
            return;
        }
        process.exit(0);
        return;

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


http.createServer(function (req, res) {
    'use strict';
    req = req;
    res.set_handle_version();
    res.write('end');
    res.end();
}).listen(3000);