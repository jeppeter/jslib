var https = require('https');
var tracelog = require('../../../tracelog');
var extargsparse = require('extargsparse');
var parser, args;
var express = require('express');
var fs = require('fs');
var commandline = `
{
    "port|p" : 447,
    "key|k" : "server.pem",
    "cert|c" : "servercert.pem"
}
`;
var app = express();
parser = extargsparse.ExtArgsParse();
tracelog.init_args(parser);
parser.load_command_line_string(commandline);
args = parser.parse_command_line();


tracelog.set_args(args);

app.get('/', function (req, res) {
    'use strict';
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req = req;
    tracelog.info('call from %s', ip);
    res.header('Content-type', 'text/html');
    return res.end('<h1>Hello, Secure World!</h1>');
});

app.get('/kernel', function (req, res) {
    'use strict';
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req = req;
    tracelog.info('call from %s', ip);
    res.header('Content-type', 'text/html');
    return res.end('<h1>Kernel</h1>');
});

tracelog.info('list on %d', args.port);
https.createServer({
    key: fs.readFileSync(args.key),
    cert: fs.readFileSync(args.cert)
},
        app).listen(args.port);

