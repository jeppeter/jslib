var jstracer = require('jstracer');
var extargsparse = require('extargsparse');
var parser, args;
var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();
var util = require('util');
var getmapfiles = {};
var postmapfiles = {};
var commandline_fmt = `
{
    "port|p" : 447,
    "key|k" : "%s",
    "cert|c" : "%s",
    "postkey" : [],
    "getkey" : []
}
`;

var curkeyfile = path.join(__dirname, 'selfsigned.key');
var curcertfile = path.join(__dirname, 'selfsigned.crt');

curcertfile = curcertfile.replace(/\\/g, '\\\\');
curkeyfile = curkeyfile.replace(/\\/g, '\\\\');

var commandline = util.format(commandline_fmt, curkeyfile, curcertfile);

parser = extargsparse.ExtArgsParse();
jstracer.init_args(parser);
parser.load_command_line_string(commandline);
args = parser.parse_command_line();

jstracer.set_args(args);

var httpscfg = {
    key: fs.readFileSync(args.key),
    cert: fs.readFileSync(args.cert)
};


var write_sock_process = function (fname, sock, rstream, endcallback) {
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
        jstracer.error('can not read %s error(%s)', fname, err);
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


var get_call_back = function (req, rsp) {
    'use strict';
    //jstracer.info('req path [%s]', util.inspect(req));
    var cfile = getmapfiles[req.url];
    jstracer.info('cfile [%s]', cfile);
    if (cfile !== undefined && cfile !== null) {
        var rstream = fs.createReadStream(cfile);
        write_sock_process(cfile, rsp, rstream, function (err) {
            err = err;
            rstream.close();
            rsp.end();
        });
    } else {
        rsp.write('hello world');
        rsp.end();
    }
};

var post_call_back = function (req, rsp) {
    'use strict';
    //jstracer.info('req path [%s]', util.inspect(req));
    var alldata = '';
    req.on('data', function (chk) {
        alldata += chk;
    });
    req.on('end', function () {
        jstracer.info('alldata\n%s', alldata);
        jstracer.info('url %s', req.url);
        var cfile = postmapfiles[req.url];
        jstracer.info('cfile [%s]', cfile);
        if (cfile !== undefined && cfile !== null) {
            var rstream = fs.createReadStream(cfile);
            write_sock_process(cfile, rsp, rstream, function (err) {
                err = err;
                rstream.close();
                rsp.end();
            });
        } else {
            rsp.write('hello world');
            rsp.end();
        }
    });
};


args.getkey.forEach(function (elm) {
    'use strict';
    var sarr = elm.split('=', 2);
    if (sarr.length > 1) {
        getmapfiles[sarr[0]] = sarr[1];
        app.get(sarr[0], get_call_back);
    }
});

args.postkey.forEach(function (elm) {
    'use strict';
    var sarr = elm.split('=', 2);
    if (sarr.length > 1) {
        jstracer.info('set post[%s]', sarr[0]);
        postmapfiles[sarr[0]] = sarr[1];
        app.post(sarr[0], post_call_back);
    }
});




// var is_error_valid = function (err) {
//     'use strict';
//     if (err === undefined || err === null) {
//         return false;
//     }
//     return true;
// };


var httpsv = require('https').createServer(httpscfg, app);
httpsv.listen(args.port, function () {
    'use strict';
    jstracer.debug('listen on https %s', args.port);
});


