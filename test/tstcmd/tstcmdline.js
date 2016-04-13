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

tracelog.trace('print trace (%d)', argv.verbose);
tracelog.debug('print debug (%d)', argv.verbose);
tracelog.info('print info (%d)', argv.verbose);
tracelog.warn('print warn (%d)', argv.verbose);
tracelog.error('print error (%d)', argv.verbose);

tracelog.finish();