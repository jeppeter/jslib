var tracelog = require('../../tracelog');
var grabwork = require('../../grabwork');
var yargs = require('yargs');
var util = require('util');
var grab = grabwork();
var hkexnewsmain_post = require('./hkexnewsmain_post');
var hkexnewspaper_post = require('./hkexnewspaper_post');
var random_delay = require('./random_delay');

var argv = yargs.usage(util.format('Usage %s [OPTIONS] file', process.argv[1]))
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
    .option('url', {
        alias: 'U',
        description: 'set urls to request',
        default: 'http://www.hkexnews.hk/listedco/listconews/advancedsearch/search_active_main_c.aspx',
        type: 'string'
    })
    .argv;

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

grab.add_pre(random_delay());
grab.add_post(hkexnewsmain_post());
grab.add_post(hkexnewspaper_post());

grab.queue(argv.url, {
    hkexnewsmain: true
});