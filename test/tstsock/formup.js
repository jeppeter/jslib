var formidable = require('formidable');
var http = require('http');
var util = require('util');

http.createServer(function (req, res) {
    'use strict';
    if (req.url === '/upload' && req.method.toLowerCase() === 'post') {
        // parse a file upload
        var form = new formidable.IncomingForm();

        form.parse(req, function (err, fields, files) {
            if (err) {
                res.writeHead(404, {
                    error: JSON.stringify(err)
                });
                res.end();
                return;
            }
            res.writeHead(200, {
                'content-type': 'text/plain'
            });
            res.write('received upload:\n\n');
            res.end(util.inspect({
                fields: fields,
                files: files
            }));
        });

        return;
    }

    // show a file upload form
    res.writeHead(200, {
        'content-type': 'text/html'
    });
    res.end(
        '<form action="/upload" enctype="multipart/form-data" method="post">' +
        '<input type="file" name="upload" multiple><br>' +
        '<input type="submit" value="Upload">' +
        '</form>'
    );
}).listen(8080);