//var http = require('http');
var tracelog = require('../../../tracelog');
var extargsparse = require('extargsparse');
var parser, args;
var express = require('express');
var util = require('util');
var fs = require('fs');
var commandline = `
{
    "port|p" : 447,
    "key|k" : "server.pem",
    "cert|c" : "servercert.pem",
    "kernel|K" : null,
    "initrd|I" : null
}
`;
var app = express();
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
    /*now we should make coding for more than handing*/
    fs.fstat(args.kernel, function (err, stats) {
        var parameters = '';
        var rstream;
        if (err !== null) {
            tracelog.error('can not stat (%s) error(%s)', args.kernel, err);
            res.status(401);
            return res.end();
        }


        parameters += util.format('ISCSI_INITIATOR=com.bingte.iscsi.client1');
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': util.format('%d', (stats.size + parameters.length + 1))
        });

        rstream = fs.createReadStream(args.kernel, 'UTF-8');
        rstream.on('data', function(chunk) {
            res.write(chunk);
        });
        rstream.on('error', function(err2) {

        });
        rstream.on('end' , function() {

        });


    });
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


app.listen(args.port, function () {
    'use strict';
    tracelog.info('list on %d', args.port);
});
