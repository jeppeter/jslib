var fs = require('fs');

process.argv.forEach(function (elm, idx) {
    'use strict';
    var rstream;
    if (idx >= 2) {
        console.log('read %s', elm);
        rstream = fs.createReadStream(elm);
        rstream.on('open', function () {
            console.log('pipe %s', elm);
            rstream.pipe(process.stdout);
        });

        rstream.on('error', function (err) {
            console.log('\n------- %s error(%s)', elm, err);
        });
        rstream.on('end', function () {
            console.log('\n++++++++ end %s', elm);
        });
    }
});