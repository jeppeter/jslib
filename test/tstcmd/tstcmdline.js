//var util = require('util');
var jstracer = require('jstracer');
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
jstracer.init_args(parser);
argv = parser.parse_command_line();



jstracer.set_args(argv);

jstracer.trace('print trace (%d)', argv.verbose);
jstracer.debug('print debug (%d)', argv.verbose);
jstracer.info('print info (%d)', argv.verbose);
jstracer.warn('print warn (%d)', argv.verbose);
jstracer.error('print error (%d)', argv.verbose);
jstracer.info('interactive %s', argv.interactive);

process.on('SIGINT', function () {
    'use strict';
    jstracer.warn('caught sig int');
    jstracer.finish(function (err) {
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
    jstracer.error('error (%s)', err);
    jstracer.finish(function (err) {
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
    jstracer.finish(function (err) {
        'use strict';
        if (err) {
            console.log('error on (%s)', err);
            return;
        }
        process.exit(0);
    });
}