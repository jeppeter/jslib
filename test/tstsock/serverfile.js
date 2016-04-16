var filehandle = require('./lib/filehandle');
var qs = require('querystring');
var util = require('util');
var http = require('http');
var tracelog = require('./lib/tracelog');
var yargs = require('yargs');
var path = require('path');
var fs = require('fs');
var args = yargs.count('verbose')
    .alias('verbose', 'v')
    .usage(util.format('Usage %s [OPTIONS] directory', process.argv[1]))
    .help('h')
    .alias('h', 'help')
    .array('appendlog')
    .alias('appendlog', 'A')
    .array('createlog')
    .alias('createlog', 'C')
    .default('path', __dirname)
    .alias('path', 'P')
    .default('port', 9000)
    .alias('port', 'p')
    .default('format', '<{{title}}>:{{file}}:{{line}} {{message}}\n')
    .alias('format', 'F').argv;


var directory = args.path;
var lport = args.port;
var logopt = {};
var jsdir = __dirname;
if (args.verbose >= 4) {
    logopt.level = 'trace';
} else if (args.verbose >= 3) {
    logopt.level = 'debug';
} else if (args.verbose >= 2) {
    logopt.level = 'info';
} else if (args.verbose >= 1) {
    logopt.level = 'warn';
} else {
    logopt.level = 'error';
}

logopt.format = args.format;
tracelog.Init(logopt);
filehandle.set_dir(directory);

http.createServer(function (req, res) {
    'use strict';
    var inputjson;
    var host, hostarr;
    inputjson = {};
    inputjson.requrl = qs.unescape(req.url);
    host = req.headers.host;
    hostarr = host.split(':');
    host = hostarr[0];
    tracelog.debug('req.method %s', req.method);
    if (req.method === 'GET') {
        filehandle.list_dir(inputjson, req, res, function (err, outputjson, req, res) {
            var s;
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }

            if (outputjson.hashandled) {
                /*to no handle this*/
                return;
            }

            res.writeHead(200);
            s = req.url;
            s = '';
            s += '<html>';
            s += '<body>';
            if (util.isArray(outputjson.lists)) {
                outputjson.lists.forEach(function (elm) {
                    if (elm.type === 'dir') {
                        s += util.format('<a href="%s">%s</a> %s <br>', elm.href, elm.displayname, 'DIR');
                    } else {
                        s += util.format('<a href="%s">%s</a> size %d %s <br>', elm.href, elm.displayname, elm.size, 'FILE');
                    }
                });
            }

            s += util.format('<script src="http://%s:%d/js/jquery.min.js"></script>', host, (lport + 1));
            s += util.format('<form method="post" action="%s" name="submit" enctype="multipart/form-data">', req.url);
            s += '<input type="file" name="fileField"><br /><br />';
            s += '<input type="submit" name="submit" value="Submit"></form>';

            s += '</body>';
            s += '</html>';
            res.end(s);
        });
    } else if (req.method === 'PUT' || req.method === 'POST') {
        filehandle.put_file(inputjson, req, res, function (err, outputjson, req, res) {
            err = err;
            outputjson = outputjson;
            req = req;
            res = res;
        });
    }
}).listen(lport);

http.createServer(function (req, res) {
    'use strict';
    var requrl;
    var getfile;
    var newfile;
    var rstream;
    var host;
    var hostarr;
    requrl = req.url;
    host = req.headers.host;
    hostarr = host.split(':');
    hostarr = hostarr[0].split(':');
    tracelog.info('host %s hostarr (%s)', host, hostarr);
    getfile = qs.unescape(requrl);
    getfile = jsdir + getfile;


    newfile = getfile.replace(path.sep, '/');
    while (newfile !== getfile) {
        getfile = newfile;
        newfile = getfile.replace(path.sep, '/');
    }
    getfile = getfile.replace(/[\/]+/g, path.sep);
    tracelog.info('get file %s', getfile);

    fs.stat(getfile, function (err, stats) {
        var errorinfo;
        if (err) {
            errorinfo = util.format('error %s', JSON.stringify(err));
            res.write(errorinfo);
            res.end();
            return;
        }

        if (stats.isDirectory()) {
            errorinfo = util.format('(%s) is directory');
            res.write(errorinfo);
            res.end();
            return;
        }

        rstream = fs.createReadStream(getfile);
        rstream.on('open', function () {
            tracelog.info('opened (%s)', getfile);
            rstream.pipe(res);
        });
        rstream.on('error', function (err) {
            tracelog.error('read %s error(%s)', getfile, JSON.stringify(err));
            res.end();
        });

        rstream.on('end', function () {
            tracelog.info('ended (%s)', getfile);
            res.end();
        });

    });
}).listen(lport + 1);

tracelog.info('listne(%d) on (%s)', lport, directory);