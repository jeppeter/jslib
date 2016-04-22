var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    'use strict';
    req = req;
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', function (req, res) {
    'use strict';

    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/uploads');

    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function (field, file) {
        field = field;
        console.log('create file (%s)', file.name);
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });

    // log any errors that occur
    form.on('error', function (err) {
        console.log('An error has occured: \n' + err);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function () {
        console.log('end');
        res.end('success');
    });

    // parse the incoming request containing the form data
    form.parse(req);

});

app.listen(3000, function () {
    'use strict';
    console.log('Server listening on port 3000');
});