var udp4 = require('dgram');

var server = udp4.createSocket("udp4");
var lport = 4132;

server.on("message", function (msg, rinfo) {
    'use strict';
    var rmsg;
    rmsg = "reply : " + msg;
    server.send(rmsg, 0, rmsg.length, rinfo.port, rinfo.address, function (err, bytes) {
        if (err) {
            console.log("send %s error %s bytes %s", rmsg, err, bytes);
        }
        return;
    });
});
server.on("error", function (err) {
    'use strict';
    if (err) {
        console.log("get error %s", err);
    }
    return;
});

if (process.argv.length > 2) {
    lport = process.argv[2];
}

server.on("close", function () {
    'use strict';
    console.log("closed %d", lport);
    server.bind(lport);
});
server.on("listening", function () {
    'use strict';
    console.log("listen on %d", lport);
});

server.bind(lport);