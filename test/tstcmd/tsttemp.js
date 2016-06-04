var tmp = require('mktemp');
var fs = require('fs');


process.argv.forEach(function (elm, idx) {
    'use strict';
    if (idx >= 2) {
        tmp.createFile(elm, function (err, path) {
            if (err) {
                console.error('can not create %s', elm);
                return;
            }
            console.log('create %s %s', elm, path);
            fs.unlink(path, function (err2) {
                if (err2) {
                    console.error('can not unlink (%s) error(%s)', path, JSON.stringify(err2));
                    return;
                }
                console.log('delete (%s) succ', path);
            });
        });
    }
});