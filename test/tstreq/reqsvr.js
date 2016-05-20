var express = require('express');
var commander = require('commander');
var tracelog = require('../../tracelog');
var util = require('util');
var app;

commander
    .version('0.2.0')
    .option('-p --port <port>', 'set port to listen', function (t, v) {
        'use strict';
        t = t;
        return parseInt(v);
    }, 9000);


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
    req.session_set = 'session set';
    tracelog.info('write hello');
    res.send('<html><body><p>hello world</p></body></html>');
    return;
};

var session_request = function (req, res, next) {
    'use strict';
    tracelog.info('call session');
    tracelog.info('req.headers (%s)', util.inspect(req.headers, {
        showHidden: true,
        depth: null
    }));
    if (req.session_set === undefined || req.session_set === null) {
        next();
        return;
    }
    req.on('end', function () {
        tracelog.info('session ended');
    });
    req.on('close', function () {
        tracelog.info('session closed');
    });
    tracelog.info('write session');
    res.end('<html><body><p>session read</p></body></html>');
    return;
};

commander.parse(process.argv);
tracelog.set_commander(commander);

app = express();
app.use(handler_request);
app.use(session_request);

tracelog.info('listen on %d', commander.port);
app.listen(commander.port);