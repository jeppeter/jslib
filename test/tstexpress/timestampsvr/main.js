//var http = require('http');
var jstracer = require('jstracer');
var extargsparse = require('extargsparse');
var parser, args;
var express = require('express');
var util = require('util');
var fs = require('fs');
var commandline = `
{
    "port|p" : 7790,
    "data|D" : null
}
`;
var app = express();
parser = extargsparse.ExtArgsParse();
jstracer.init_args(parser);
parser.load_command_line_string(commandline);
args = parser.parse_command_line();


jstracer.set_args(args);

if (args.data === null) {
    jstracer.error('no --data specified');
    process.exit(3);
}




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
            //jstracer.info('pause read (%d)', writed);
            rstream.pause();
            sock.actpaused = true;
        }
    });
    rstream.on('error', function (err) {
        jstracer.error('can not read %s error(%s)', args.files[0], err);
        if (endcallback !== null) {
            endcallback(err);
        }
        return;
    });
    rstream.on('end', function () {
        jstracer.info('rstream end write (%d)', writed);
        if (endcallback !== null) {
            endcallback(null);
        }
    });
    sock.on('drain', function () {
        if (sock.paused !== true && sock.actpaused === true) {
            //jstracer.info('resume not paused');
            rstream.resume();
            sock.actpaused = false;
        } else if (sock.paused === true) {
            jstracer.info('writable on paused time');
        } else {
            jstracer.info('sock no drain');
        }
    });
    sock.on('data', function (chunk) {
        jstracer.info('read data [%s] discard', chunk);
    });
    sock.on('error', function (err3) {
        jstracer.error('sock error (%s)', err3);
        if (endcallback !== null) {
            endcallback(err3);
        }
    });
};



app.post('/', function (req, res) {
    'use strict';
    req = req;
    /*now we should make coding for more than handing*/
    fs.lstat(args.data, function (err, stats) {
        var parameters = '';
        var rstream = null;
        var totallen = 0;
        if (err !== null) {
            jstracer.error('can not stat (%s) error(%s)', args.kernel, err);
            res.status(401);
            return res.end();
        }

        totallen = stats.size;
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': util.format('%d', totallen)
        });
        jstracer.info('totallen %d', totallen);
        rstream = fs.createReadStream(args.data);
        write_sock_process(res, rstream, function (err) {
            if (rstream !== null && res !== null && !is_error_valid(err)) {
                jstracer.info('will write parameters');
                res.write(parameters, 'binary');
                res.end();
            }
            jstracer.info('rstream %s res %s', rstream, res);
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



app.listen(args.port, function () {
    'use strict';
    jstracer.info('list on %d', args.port);
});