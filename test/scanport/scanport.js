var extargsparse = require('extargsparse');
var jstracer = require('jstracer');

var command_line = `
    {
        "port|p" : null,
        "maxconnect|m": 0,
        "scan<scan>## scan port of computer ##" : {
            "$" : "+"
        }
    }
`;

var scan_handler = function (args, parser) {
    'use strict';
    jstracer.set_args(args);
    args = args;
    parser = parser;
};

exports.scan = scan_handler;

var parser;

parser = extargsparse.ExtArgsParse();
jstracer.init_args(parser);
parser.load_command_string(command_line);

parser.parse_command_line(null, parser);