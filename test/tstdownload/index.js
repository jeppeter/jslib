var http = require('http');
var path = require('path');
var url = process.argv[2];
var file;
var fs = require('fs');
var util = require('util');

if (process.argv.length > 3) {
    file = process.argv[3];
} else {
    file = path.basename(url);
}

var download_file = function (url, file, callback) {
    'use strict';
    var wf = fs.createWriteStream(file);
    http.get(url, function (res) {
        if (res.statusCode !== 200) {
            var err = util.format('statusCode %d', res.statusCode);
            callback(err, file, url);
            return;
        }
        res.on('error', function (err) {
            wf.close();
            callback(err, file, url);
        });
        res.on('data', function (chunk) {
            wf.write(chunk);
        });
        res.on('end', function () {
            wf.close();
            callback(null, file, url);
        });
    });
};

download_file(url, file, function (err, file2, url2) {
    'use strict';
    if (err) {
        console.error('download [%s] error [%s]', url2, err);
    } else {
        console.log('write [%s] ok', file2);
    }
});

