var express = require('express');
var commander = require('commander');
var tracelog = require('../../tracelog');
var util = require('util');
var app;

commander
    .version('0.2.0')
    .option('-p --port <port>', 'set port to listen', function (t, v) {
        'use strict';
        v = v;
        return parseInt(t);
    }, 9000)
    .option('-t --timeout <timemills>', 'set timeout mills', function (t, v) {
        'use strict';
        v = v;
        return parseInt(t);
    }, 5000);


tracelog.init_commander(commander);

var handler_request = function (req, res, next) {
    'use strict';
    tracelog.info('call handler');
    tracelog.info('req.headers (%s)', util.inspect(req.headers, {
        showHidden: true,
        depth: null
    }));
    if (req.session_set !== undefined && req.session_set !== null) {
        next();
        return;
    }
    req.on('end', function () {
        tracelog.info('handler ended');
    });
    req.on('close', function () {
        tracelog.info('handler closed');
    });
    res.on('end', function () {
        tracelog.info('res end');
    });
    res.on('close', function () {
        tracelog.info('res close');
    });
    res.on('error', function (err) {
        tracelog.info('error (%s)', JSON.stringify(err));
        return;
    });
    req.gettimeout = null;
    req.gettimeout = setTimeout(function () {
        tracelog.info('write hello');
        res.send('<html><body><p>hello world</p></body></html>');
        if (req.gettimeout !== null && req.gettimeout !== undefined) {
            clearTimeout(req.gettimeout);
        }
        req.gettimeout = null;
    }, commander.timeout);
    return;
};


commander.parse(process.argv);
tracelog.set_commander(commander);

app = express();
app.use(handler_request);

tracelog.info('listen on %d', commander.port);
app.listen(commander.port);