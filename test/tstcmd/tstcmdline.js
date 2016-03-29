var yargs = require('yargs');
var util = require('util');
var tracer = require('tracer');

var argv = yargs.count('verbose')
    .alias('verbose', 'v')
    .usage(util.format('Usage %s [OPTIONS] file', process.argv[1]))
    .default({
        file: __filename,
        interactive: 'no'
    })
    .help('h')
    .alias('h', 'help')
    .alias('file', 'F')
    .demand(1)
    .alias('i', 'interactive')
    .argv;

console.log(argv);

if (argv.verbose >= 3){
    tracer.setle
}
