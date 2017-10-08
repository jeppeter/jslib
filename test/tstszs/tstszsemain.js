var jstracer = require('jstracer');
var cheerio = require('cheerio');
var extargsparse = require('extargsparse');
var fs = require('fs');

var szse_main_get_number_span = function(htmldata, args, callback) {
    'use strict';
    var parser ;
    parser = cheerio.load(htmldata);
    return 0;
};


var commandline = `
    {
        '$' : 1
    }
`;

var trace_exit = function (ec) {
    'use strict';
    jstracer.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};

process.on('uncaughtException', function (err) {
    'use struct';
    jstracer.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', function () {
    'use strict';
    trace_exit(0);
});

var extparser = extargsparse.ExtArgsParser();
var args;
extparser.load_command_line_string(commandline);
jstracer.init_args(extparser);

args = extparser.parse_command_line();