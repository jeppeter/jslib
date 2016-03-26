var directory = __dirname;
var lport = 9000;

if (process.argv.length > 2) {
    directory = process.argv[2];
}

if (process.argv.length > 3) {
    lport = process.argv[3];
}

var fs = require('fs');
var http = require('http');

http.createServer(function (req, res) {
    'use strict';
    var outfile = directory + req.url;
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
}).listen(lport);
console.log('listen on %d with dir %s', lport, directory);