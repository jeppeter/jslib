var filehandle = require('./lib/filehandle');
var qs = require('querystring');
var util = require('util');
var http = require('http');
var tracelog = require('./lib/tracelog');
var yargs = require('yargs');
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
    inputjson = {};
    inputjson.requrl = qs.unescape(req.url);
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

tracelog.info('listne(%d) on (%s)', lport, directory);