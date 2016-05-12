var yargs = require('yargs');
var util = require('util');
var tracelog = require('../../tracelog');
var http = require('http');

var argv = yargs.usage(util.format('Usage %s [OPTIONS] file', process.argv[1]))
    .option('verbose', {
        count: true,
        description: 'log level 0 for error 1 for warn 2 for info 3 for debug 4 for trace',
        default: -1,
        alias: 'v'
    })
    .help('h')
    .alias('h', 'help')
    .option('noconsole', {
        boolean: true,
        description: 'set no console output for log',
        default: false,
        alias: 'N'
    })
    .help('h')
    .alias('h', 'help')
    .option('files', {
        alias: 'F',
        default: [],
        description: 'set File to record opened by truncate',
        type: 'array'
    })
    .option('appendfiles', {
        alias: 'A',
        default: [],
        description: 'set File to record opened by append',
        type: 'array'

    })
    .option('interactive', {
        alias: 'i',
        default: false,
        description: 'set not exit mode',
        type: 'boolean'
    })
    .argv;

//console.log(argv);

var logopt;
logopt = {};
if (argv.verbose >= 4) {
    logopt.level = 'trace';
} else if (argv.verbose >= 3) {
    logopt.level = 'debug';
} else if (argv.verbose >= 2) {
    logopt.level = 'info';
} else if (argv.verbose >= 1) {
    logopt.level = 'warn';
} else {
    logopt.level = 'error';
}

if (argv.noconsole) {
    logopt.noconsole = true;
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

if (argv.i) {
    http.createServer(function (req, res) {
        'use strict';
        req = req;
        res.set_handle_version();
        res.write('end');
        res.end();
    }).listen(3000);
} else {
    tracelog.finish(function (err) {
        'use strict';
        if (err) {
            console.log('error on (%s)', err);
            return;
        }
        process.exit(0);
    });
}