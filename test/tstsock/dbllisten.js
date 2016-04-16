var http = require('http');
var yargs = require('yargs');

var args = yargs.help('h')
    .alias('h', 'help')
    .default('port', 3000)
    .alias('port', 'p')
    .argv;

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