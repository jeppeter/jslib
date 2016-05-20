var tracelog = require('../../tracelog');
var commander = require('commander');
//var keepagent = require('keep-alive-agent');
var http = require('http');
var url = 'http://127.0.0.1:9000/';
var util = require('util');
var URL = require('url');
var req = null;

commander
    .version('0.2.0')
    .usage('[options] <url>');

var trace_exit = function (ec) {
    'use strict';
    tracelog.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};


tracelog.init_commander(commander);

commander.parse(process.argv);
tracelog.set_commander(commander);

if (commander.args !== undefined && Array.isArray(commander.args) && typeof commander.args[0] === 'string' && commander.args[0].length > 0) {
    url = commander.args[0];
}

var hostname;
var portnum;
var parser;
var hagent;

parser = URL.parse(url);
hostname = parser.hostname;
portnum = parser.port;
hagent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 3000
});
tracelog.info('hostname %s portnum %d pathname %s', hostname, portnum, parser.pathname);
var getOptions = {
    hostname: hostname,
    port: portnum,
    path: parser.pathname,
    agent: hagent,
    headers: {
        connection: 'Keep-Alive'
    }
};

req = http.get(getOptions, function (reps) {
    'use strict';
    tracelog.info('resp %s', util.inspect(reps, {
        showHidden: true,
        depth: null
    }));
    http.get(getOptions, function (resp2) {
        tracelog.info('resp %s', util.inspect(resp2, {
            showHidden: true,
            depth: null
        }));
        trace_exit(0);
    });
});