var udp4 = require('dgram');

var cli = udp4.createSocket('udp4');
var uhost = '127.0.0.1';
var uport = 4132;

if (process.argv.length > 2) {
    uhost = process.argv[2];
}

if (process.argv.length > 3) {
    uport = process.argv[3];
}

cli.on("message", function (msg, rinfo) {
    'use strict';
    console.log("received %s from (%s:%d)", msg, rinfo.address, rinfo.port);
});

process.stdin.on('readable', function () {
    'use strict';
    var chunk = process.stdin.read();
    if (chunk !== null) {
        chunk = String(chunk);
        chunk = chunk.replace(/(\r\n)+$/, '');
        cli.send(chunk, 0, chunk.length, uport, uhost, function (err) {
            if (err) {
                console.log('send (%s) to (%s:%d) error(%s) ', chunk, uhost, uport, err);
            }
            return;
        });
    }
});

process.stdin.on('end', function () {
    'use strict';
    process.exit(0);
});