var yargs = require('yargs');
var util = require('util');
var tracelog = require('./lib/tracelog');

var argv = yargs.count('verbose')
    .alias('verbose', 'v')
    .usage(util.format('Usage %s [OPTIONS] file', process.argv[1]))
    .default({
        file: [],
        interactive: 'no'
    })
    .help('h')
    .alias('h', 'help')
    .array('files')
    .array('appendfiles')
    .alias('appendfiles', 'A')
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

tracelog.trace('print trace');
tracelog.debug('print debug');
tracelog.log('print log');
tracelog.info('print info');
tracelog.warn('print warn');
tracelog.error('print error');

tracelog.finish();