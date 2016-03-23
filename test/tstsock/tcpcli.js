
var net = require('net');
var portnum = 8124;
if (process.argv.length >= 3) {
    portnum = process.argv[2];
}

var client = net.connect({port: portnum}, function () {
    'use strict';
    console.log("connect %d", portnum);
    client.write("hello from client\r\n");
});

client.on('data', function (data) {
    'use strict';
    console.log("get data %s", data);
    client.end();
});

client.on('end', function () {
    'use strict';
    console.log('end');
});

