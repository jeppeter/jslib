var https = require('https');
var tracelog = require('../../../tracelog');
var extargsparse = require('extargsparse');
var parser, args;
var express = require('express');
var fs = require('fs');
var seckey = '';
var seccert = '';
var app = express();
var util = require('util');
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


if (args.kernel === null || args.vmlinuz === null) {
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

var is_error_valid = function (err) {
    'use strict';
    if (err === undefined || err === null) {
        return false;
    }
    return true;
};


var write_sock_process = function (sock, rstream, endcallback) {
    'use strict';
    var writed = 0;
    sock.paused = false;
    sock.actpaused = false;
    rstream.on('data', function (chunk) {
        var bret;
        bret = sock.write(chunk, 'binary');
        writed += chunk.length;
        if (!bret) {
            //tracelog.info('pause read (%d)', writed);
            rstream.pause();
            sock.actpaused = true;
        }
    });
    rstream.on('error', function (err) {
        tracelog.error('can not read %s error(%s)', args.files[0], err);
        if (endcallback !== null) {
            endcallback(err);
        }
        return;
    });
    rstream.on('end', function () {
        tracelog.info('rstream end write (%d)', writed);
        if (endcallback !== null) {
            endcallback(null);
        }
    });
    sock.on('drain', function () {
        if (sock.paused !== true && sock.actpaused === true) {
            //tracelog.info('resume not paused');
            rstream.resume();
            sock.actpaused = false;
        } else if (sock.paused === true) {
            tracelog.info('writable on paused time');
        } else {
            tracelog.info('sock no drain');
        }
    });
    sock.on('data', function (chunk) {
        tracelog.info('read data [%s] discard', chunk);
    });
    sock.on('error', function (err3) {
        tracelog.error('sock error (%s)', err3);
        if (endcallback !== null) {
            endcallback(err3);
        }
    });
};



app.get('/kernel', function (req, res) {
    'use strict';
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req = req;
    tracelog.info('call from %s', ip);
    /*now we should make coding for more than handing*/
    fs.lstat(args.kernel, function (err, stats) {
        var parameters = '';
        var rstream = null;
        var totallen = 0;
        if (err !== null) {
            tracelog.error('can not stat (%s) error(%s)', args.kernel, err);
            res.status(401);
            return res.end();
        }

        parameters += util.format('ISCSI_INITIATOR=com.bingte.iscsi.client1 ' + '\0');
        totallen = (stats.size + parameters.length);
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': util.format('%d', totallen)
        });
        tracelog.info('totallen %d', totallen);
        rstream = fs.createReadStream(args.kernel);
        write_sock_process(res, rstream, function (err) {
            if (rstream !== null && res !== null && !is_error_valid(err)) {
                tracelog.info('will write parameters');
                res.write(parameters, 'binary');
                res.end();
            }
            tracelog.info('rstream %s res %s', rstream, res);
            if (rstream !== null) {
                rstream.close();
            }
            rstream = null;
            if (res !== null) {
                res.end();
            }
            res = null;
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