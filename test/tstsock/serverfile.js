var filehandle = require('./lib/filehandle');
var qs = require('querystring');
var util = require('util');
var http = require('http');
var tracelog = require('../../tracelog');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var extargsparse = require('extargsparse');
var args, parser;
var command_line_fmt = `
    {
        "path|P" : "%s",
        "port|p" : 9000
    }
`;

var command_line = util.format(command_line_fmt, __dirname.replace(/\\/g, '\\\\'));
parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(command_line);
tracelog.init_args(parser);
args = parser.parse_command_line();
tracelog.set_args(args);


var directory = args.path;
var lport = args.port;
var jsdir = __dirname;
var indexejs = jsdir + path.sep + 'index.ejs';
var __handle_ejsdata_func = function () {
    'use strict';
    var ejsdata;

    return function (file, callback) {
        tracelog.trace('call test ejsdata');
        if (ejsdata) {
            tracelog.trace('will put ejsdata (%s)', ejsdata);
            callback(null, ejsdata);
            return ejsdata;
        }
        tracelog.trace('fs read %s', file);
        fs.readFile(file, 'utf-8', function (err, data1) {
            if (err) {
                callback(err, null);
                return;
            }
            ejsdata = data1;
            callback(null, ejsdata);
            return ejsdata;
        });
        return null;
    };
};


process.on('SIGINT', function () {
    'use strict';
    tracelog.warn('caught sig int');
    tracelog.finish(function (err) {
        if (err) {
            console.error('on finish error (%s)', err);
            return;
        }
        process.exit(0);
    });
});

process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s)', err);
    tracelog.finish(function (err) {
        if (err) {
            console.log('error on (%s)', err);
            return;
        }
        process.exit(4);
    });
});


var handle_ejsdata = __handle_ejsdata_func();

http.createServer(function (req, res) {
    'use strict';
    var inputjson;
    var host, hostarr;
    inputjson = {};
    /*tracelog.info(util.inspect(req, {
        showHidden: true,
        depth: null
    }));*/
    inputjson.requrl = qs.unescape(req.url);
    host = req.headers.host;
    hostarr = host.split(':');
    host = hostarr[0];
    host = util.format('http://%s:%d', host, lport + 1);
    tracelog.info('(%s)method %s', req.headers.host, req.method);
    if (req.method === 'GET') {
        inputjson.basedir = directory;
        filehandle.list_dir(inputjson, req, res, function (err, outputjson, req, res) {
            var s;
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify(err));
                return;
            }

            if (outputjson.hashandled) {
                /*to no handle this*/
                return;
            }

            outputjson.url = req.url;
            outputjson.host = host;
            handle_ejsdata(indexejs, function (err, data2) {
                if (err) {
                    res.writeHead(500);
                    res.end(JSON.stringify(err));
                    return;
                }
                req = req;
                try {
                    s = ejs.render(data2, outputjson);
                    res.writeHead(200);
                    res.end(s);
                    return;
                } catch (e) {
                    res.writeHead(500);
                    if (typeof e === 'object') {
                        if (err.message) {
                            tracelog.error('error (%s)', err.message);
                        }
                        if (err.stack) {
                            tracelog.error('stack (%s)', err.stack);
                        }
                        tracelog.error('%s', JSON.stringify(err));
                    } else {
                        tracelog.error('error %s', err);
                    }
                    res.end(JSON.stringify(e));
                    return;
                }
            });
            return;

        });
    } else if (req.method === 'PUT' || req.method === 'POST') {
        inputjson.basedir = directory;
        filehandle.put_file(inputjson, req, res, function (err, outputjson, req, res) {
            if (err) {
                res.writeHead(500);
                res.write(JSON.stringify(err));
                res.end();
                return;
            }
            outputjson = outputjson;
            req = req;

            res.writeHead(200);
            res.write('success');
            res.end();
            return;

        });
    } else if (req.method === 'OPTIONS') {
        var body = [];
        req.on('data', function (chunk) {
            body.push(chunk);
        }).on('end', function () {
            var setmaxage = false;
            tracelog.info('body (%s)', Buffer.concat(body).toString());
            if (req.headers['access-control-request-method']) {
                res.headers('access-control-request-method', req.headers['access-control-request-method']);
                setmaxage = true;
            }

            if (req.headers['access-control-request-headers']) {
                res.headers('access-control-request-headers', req.headers['access-control-request-headers']);
                setmaxage = true;
            }

            if (setmaxage) {
                res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
            }
            res.sendStatus(200);
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
    tracelog.info('(%s)method %s', req.headers.host, req.method);
    if (req.method === 'GET') {
        requrl = req.url;
        host = req.headers.host;
        hostarr = host.split(':');
        hostarr = hostarr[0].split(':');
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
    } else if (req.method === 'POST' || req.method === 'PUT') {
        res.writeHead(501);
        res.end();
    }
}).listen(lport + 1);

tracelog.info('listne(%d) on (%s)', lport, directory);