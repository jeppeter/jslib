var directory = __dirname;
var lport = 9000;
var posix_dir;

if (process.argv.length > 2) {
    directory = process.argv[2];
}

if (process.argv.length > 3) {
    lport = process.argv[3];
}

var fs = require('fs');
var path = require('path');
var http = require('http');
var util = require('util');

directory = path.resolve(directory, '.');
posix_dir = directory.split(path.sep).join('/');

http.createServer(function (req, res) {
    'use strict';
    var outfile = directory + req.url;
    fs.stat(outfile, function (err, stats) {
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
                pdir = util.format('%s%s/..', posix_dir, req.url);
                pdir = pdir.replace(/[\/]+/g, '\\');
                console.log('pdir %s', pdir);

                pdir = path.resolve(pdir, '.');
                console.log('pdir %s', pdir);
                if (pdir.length < directory.length) {
                    pdir = '/';
                } else {
                    pdir = path.relative(directory, pdir);
                    console.log('pdir %s', pdir);
                    pdir = '/' + pdir.split(path.sep).join('/');
                }
                s += util.format('<a href="%s">..</a>  %s<br>', pdir, 'DIR');
                scancnt = 0;
                hascnt = 0;
                files.forEach(function (elem) {
                    var lfile;
                    lfile = outfile + path.sep + elem;
                    lfile = lfile.split(path.sep).join('/');
                    lfile = lfile.replace(/[\/]+/g, '/');
                    lfile = lfile.split('/').join(path.sep);
                    console.log('lfile %s', lfile);
                    scancnt += 1;
                    if (req.url.length === 1) {
                        fs.stat(lfile, function (err, stats) {
                            hascnt += 1;
                            if (err) {
                                s += util.format('%s error (%s) <br>', elem, JSON.stringify(err));
                            } else {
                                console.log('%s stats ', lfile);
                                if (stats.isDirectory()) {
                                    s += util.format('<a href="/%s">%s</a>  %s<br>', elem, elem, 'DIR');
                                } else {
                                    s += util.format('<a href="/%s">%s</a>  %s<br>', elem, elem, 'FILE');
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
                                console.log('%s stats ', lfile);
                                if (stats.isDirectory()) {
                                    s += util.format('<a href="%s/%s">%s</a>  %s<br>', req.url, elem, elem, 'DIR');
                                } else {
                                    s += util.format('<a href="%s/%s">%s</a>  %s<br>', req.url, elem, elem, 'FILE');
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
        fs.readFile(outfile, function (err, data) {
            if (err) {
                console.log('read %s error %s', outfile, JSON.stringify(err));
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }
            console.log('read %s succ', outfile);
            res.writeHead(200);
            res.end(data);
            return;
        });
        return;
    });
}).listen(lport);
console.log('listen on %d with dir %s', lport, directory);