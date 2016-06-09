var http = require('http');
var util = require('util');
var tracelog = require('../../tracelog');



http.createServer(function (req, resp) {
	tracelog.info('req headers (%s)', util.inspect(req.headers, {
		showHidden: true,
		depth: null
	}));

	req.on('end', function () {
		tracelog.info('end req');
	}).on('error', function (err) {
		tracelog.info('error (%s)', JSON.stringify(err));
	}).on('data', function (chunk) {
		tracelog.info('data (%s)', chunk);
	});

}).listen(9000);