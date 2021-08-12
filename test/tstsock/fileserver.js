var directory = __dirname;
var lport = 9000;
var posix_dir;
var extargsparse = require('extargsparse');
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var util = require('util');
var qs = require('querystring');
var jstracer = require('jstracer');
var parser ;
var args;

var commandline_fmt = `
{
    "port|p" : 9000,
    "secure|S" : false,
    "certfile": "%s",
    "keyfile" : "%s",
    "$" : "*"
}
`;

var curkeyfile = path.join(__dirname, 'selfsigned.key') ;
var curcertfile = path.join(__dirname,'selfsigned.crt');

const trace_exit = function(ec) {
    jstracer.finish(err => {
        if (err) {
            return;
        }
        process.exit(ec);
    });
};

process.on('uncaughtException', err => {
    'use struct';
    jstracer.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', () => {
    trace_exit(0);
});

curkeyfile = curkeyfile.replace(/\\/g,'\\\\');
curcertfile = curcertfile.replace(/\\/g,'\\\\');

var commandline = util.format(commandline_fmt, curcertfile,curkeyfile);




parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(commandline);
parser = jstracer.init_args(parser);
args = parser.parse_command_line();
jstracer.set_args(args);


if (args.args.Length > 0) {
    directory =  args.args[0];
}
directory = path.resolve(directory, '.');
posix_dir = directory.split(path.sep).join('/');

var http_handler = function (req, res) {
    'use strict';
    var requrl;
    var outfile;
    requrl = qs.unescape(req.url);
    outfile = directory + requrl;
    fs.stat(outfile, function (err, stats) {
        var rstream;
        if (err) {
            console.log('read %s error %s', outfile, JSON.stringify(err));
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }

        if (stats.isDirectory()) {
            var s, pdir;
            var scancnt, hascnt;
            res.writeHead(200);
            fs.readdir(outfile, function (err, files) {
                if (err) {
                    console.log('read %s error %s', outfile, JSON.stringify(err));
                    res.writeHead(404);
                    res.end(JSON.stringify(err));
                    return;
                }
                console.log('req %s', req.url);
                s = '';
                s += '<html>';
                s += '<body>';
                pdir = util.format('%s%s/..', posix_dir, requrl);
                pdir = pdir.replace(/[\/]+/g, '\\');
                console.log('pdir %s', pdir);

                pdir = path.resolve(pdir, '.');
                console.log('pdir %s', pdir);
                if (pdir.length < directory.length) {
                    pdir = '/';
                } else {
                    pdir = path.relative(directory, pdir);
                    pdir = qs.escape(pdir);
                    console.log('pdir %s', pdir);
                    pdir = '/' + pdir.split(path.sep).join('/');
                }
                s += util.format('<a href="%s">..</a>  %s<br>', pdir, 'DIR');
                scancnt = 0;
                hascnt = 0;
                files.forEach(function (elem) {
                    var lfile;
                    var elmlink, elemstr;
                    lfile = outfile + path.sep + elem;
                    lfile = lfile.split(path.sep).join('/');
                    lfile = lfile.replace(/[\/]+/g, '/');
                    lfile = lfile.split('/').join(path.sep);
                    console.log('lfile %s elem %s', lfile, elem);
                    elemstr = elem;
                    scancnt += 1;
                    if (req.url.length === 1) {
                        fs.stat(lfile, function (err, stats) {
                            hascnt += 1;
                            if (err) {
                                s += util.format('%s error (%s) <br>', elem, JSON.stringify(err));
                            } else {
                                elmlink = qs.escape(elem);
                                console.log('%s stats ', lfile);
                                if (stats.isDirectory()) {
                                    s += util.format('<a href="/%s">%s</a>  %s<br>', elmlink, elemstr, 'DIR');
                                } else {
                                    s += util.format('<a href="/%s">%s</a>  %s (%d bytes)<br>', elmlink, elemstr, 'FILE', stats.size);
                                }
                            }

                            if (scancnt === hascnt) {
                                s += '</body>';
                                s += '</html>';
                                res.end(s);
                            }
                        });
                    } else {
                        fs.stat(lfile, function (err, stats) {
                            hascnt += 1;
                            if (err) {
                                s += util.format('<h4> %s error (%s) </h4><br>', elem, JSON.stringify(err));
                            } else {
                                elmlink = requrl + '/' + elem;
                                elmlink = qs.escape(elmlink);
                                console.log('%s stats ', lfile);
                                if (stats.isDirectory()) {
                                    s += util.format('<a href="%s">%s</a>  %s<br>', elmlink, elemstr, 'DIR');
                                } else {
                                    s += util.format('<a href="%s">%s</a>  %s (%d bytes)<br>', elmlink, elemstr, 'FILE', stats.size);
                                }
                            }
                            if (scancnt === hascnt) {
                                s += '</body>';
                                s += '</html>';
                                res.end(s);
                            }
                        });
                    }
                });

                if (scancnt === 0) {
                    s += '</body>';
                    s += '</html>';
                    res.end(s);
                }

                return;
            });
            return;
        }

        rstream = fs.createReadStream(outfile);

        rstream.on('open', function () {
            rstream.pipe(res);
        });

        rstream.on('error', function () {
            res.end();
        });
        rstream.on('end', function () {
            res.end();
        });
        return;
    });
}; 


if (args.secure) {
    var options = {
        key : fs.readFileSync(args.keyfile),
        cert : fs.readFileSync(args.certfile)
    }

    https.createServer(options,http_handler).listen(args.port);
    console.log('listen secure on %d with dir %s', args.port, directory);
} else {
    http.createServer(http_handler).listen(args.port);
    console.log('listen on %d with dir %s', args.port, directory);
}

