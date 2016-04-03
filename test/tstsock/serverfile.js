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
                    s += util.format('<a href="%s">%s</a> %s <br>', elm.href, elm.displayname, 'FILE');
                }
            });
        }

        s += '</body>';
        s += '</html>';
        res.end(s);
    });
}).listen(lport);
console.log('listne(%d) on (%s)', lport, directory);