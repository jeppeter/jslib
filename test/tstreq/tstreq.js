var request = require('request');
var tracelog = require('../../tracelog');
var commander = require('commander');
var keepagent = require('keep-alive-agent');
var agent = new keepagent();
var url = 'http://127.0.0.1:9000/';
var util = require('util');
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

var usage = function (ec, cmd, fmt) {
    'use strict';
    var fp = process.stderr;
    if (ec === 0) {
        fp = process.stdout;
    }

    if (fmt !== undefined && typeof fmt === 'string' && fmt.length > 0) {
        fp.write(util.format('%s\n', fmt));
    }

    cmd.outputHelp(function (txt) {
        fp.write(txt);
        return '';
    });
    trace_exit(ec);
    return;
};

tracelog.init_commander(commander);

commander.parse(process.argv);
tracelog.set_commander(commander);

if (commander.args !== undefined && Array.isArray(commander.args) && typeof commander.args[0] === 'string' && commander.args[0].length > 0) {
    url = commander.args[0];
}

tracelog.info('request (%s)', url);
request({
    method: 'GET',
    url: url,
    forever: true,
    headers: {
        session: "new session",
        connection: "keep-alive"
    },
    agent: agent
}, function (error, response, body) {
    'use strict';
    if (error) {
        tracelog.error('request (%s) error (%s)', url, JSON.stringify(error));
        usage(3, commander, util.format('can not connect (%s)', url));
        return;
    }
    response = response;

    tracelog.info('%s', body);
    if (req !== null && req !== undefined) {
        tracelog.info('make anothercall');
        req.init({
            method: 'GET',
            url: url,
            forever: true,
            headers: {
                session: 'old session',
                connection: 'keep-alive'
            },
            agent: agent
        }, function (err2, resp2, body2) {
            if (err2) {
                tracelog.error('request (%s) error (%s)', url, JSON.stringify(err2));
                trace_exit(3);
                return;
            }
            resp2 = resp2;
            tracelog.info('body (%s)', body2);
            trace_exit(0);
            return;
        });
    } else {
        request({
            method: 'GET',
            url: url,
            headers: {
                session: "old session"
            },
            agent: agent
        }, function (err2, resp2, body2) {
            if (err2) {
                tracelog.error('request (%s) error (%s)', url, JSON.stringify(err2));
                trace_exit(3);
                return;
            }
            resp2 = resp2;
            tracelog.info('body (%s)', body2);
            trace_exit(0);
            return;
        });
    }
    return;
});

/*tracelog.info('req (%s)', util.inspect(req, {
    showHidden: true,
    depth: null
}));*/