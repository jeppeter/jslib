var https = require('https');
var tracelog = require('../../../tracelog');
var extargsparse = require('extargsparse');
var parser, args;
var express = require('express');
var fs = require('fs');
var seckey = '';
var seccert = '';
var app = express();
var commandline = `
{
    "port|p" : 447,
    "key|k" : "server.pem",
    "cert|c" : "servercert.pem",
    "kernel|K" : null,
    "initrd|I" : null
}
`;

parser = extargsparse.ExtArgsParse();
tracelog.init_args(parser);
parser.load_command_line_string(commandline);
args = parser.parse_command_line();

tracelog.set_args(args);


if (args.kernel === null ||
        args.vmlinuz === null) {
    tracelog.error('no kernel or vmlinuz specified');
    process.exit(3);
}


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
    res.download(args.kernel);
    return;
});

app.get('/initrd', function (req, res) {
    'use strict';
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req = req;
    tracelog.info('call from %s', ip);
    res.download(args.initrd);
    return;
});


fs.readFile(args.key, function (err, data) {
    'use strict';
    if (err !== null) {
        tracelog.error('can not read %s error(%s)', args.key, err);
        process.exit(3);
        return;
    }
    seckey = data;
    fs.readFile(args.cert, function (err2, data) {
        if (err2 !== null) {
            tracelog.error('can not read %s error(%s)', args.cert, err2);
            process.exit(3);
            return;
        }
        seccert = data;
        /*now we should create server*/
        tracelog.info('listen on %d', args.port);
        https.createServer({
            key: seckey,
            cert: seccert
        }, app).listen(args.port);
    });
});

