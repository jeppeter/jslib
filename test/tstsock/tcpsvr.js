var net = require('net');
var port = 8124;

var server = net.createServer(function (sock) {
    'use strict';
    sock.on("data", function (data) {
        console.log("receive data %s", data);
        sock.write(data);
    });
    sock.on("end", function () {
        console.log("closed socket");
    });
    sock.on('error', function (err) {
        console.log('error on %s', err);
        sock.end();
    });
});

if (process.argv.length >= 3) {
    port = process.argv[2];
}


server.listen(port, function () {
    'use strict';
    console.log("listen on %d", port);
});