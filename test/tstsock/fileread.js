var fs = require('fs');

if (process.argv.length < 3) {
    process.stderr.write('fileread file');
    process.exit(4);
}

var fname = process.argv[2];

fs.readFile(fname, function (err, data) {
    'use strict';
    if (err) {
        process.stderr.write('read %s error %s', fname, JSON.stringify(err));
        return;
    }
    process.stdout.write(data);
    return;
});