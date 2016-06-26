//var util = require('util');
var tracelog = require('../../tracelog');
var http = require('http');
var extargsparse = require('../../extargsparse');

var command_line = `
    {
        "interactive|i##set not exit mode##" : false
    }
`;

var parser, argv;

parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(command_line);
tracelog.init_args(parser);
argv = parser.parse_command_line();



tracelog.set_args(argv);

tracelog.trace('print trace (%d)', argv.verbose);
tracelog.debug('print debug (%d)', argv.verbose);
tracelog.info('print info (%d)', argv.verbose);
tracelog.warn('print warn (%d)', argv.verbose);
tracelog.error('print error (%d)', argv.verbose);
tracelog.info('interactive %s', argv.interactive);

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

if (argv.interactive) {
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