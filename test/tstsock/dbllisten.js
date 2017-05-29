var http = require('http');
var extargsparse = require('extargsparse');
var command_line = `
    {
        "port|p" : 3000
    }
`;

var parser, args;

parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(command_line);
args = parser.parse_command_line();

var lport = args.port;

http.createServer(function (req, res) {
    'use strict';
    req = req;
    res.write('hello from main');
    res.end();
}).listen(lport);

http.createServer(function (req, res) {
    'use strict';
    req = req;
    res.write('hello from abbr');
    res.end();
}).listen(lport + 1);