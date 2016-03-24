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
	console.log("received %s", msg);
});

