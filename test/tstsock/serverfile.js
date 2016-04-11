var filehandle = require('./lib/filehandle');
var qs = require('querystring');
var util = require('util');
var http = require('http');

var directory = __dirname;
var lport = 9000;

if (process.argv.length > 2) {
    directory = process.argv[2];
}

if (process.argv.length > 3) {
    lport = process.argv[3];
}

filehandle.set_dir(directory);

http.createServer(function (req, res) {
    'use strict';
    var inputjson;
    inputjson = {};
    inputjson.requrl = qs.unescape(req.url);
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
    } else if (req.method === 'PUT') {
        filehandle.put_file(inputjson, req, res, function (err, outputjson, req, res) {
            err = err;
            outputjson = outputjson;
            req = req;
            res = res;
        });
    }
}).listen(lport);
console.log('listne(%d) on (%s)', lport, directory);