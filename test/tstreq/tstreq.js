var request = require('request');
var tracelog = require('../../tracelog');
var extargsparse = require('../../extargsparse');
var keepagent = require('keep-alive-agent');
var agent = new keepagent();
var url = 'http://127.0.0.1:9000/';
var util = require('util');
var req = null;
var parser, args;
var command_line = `
{
    "$" : "+"
}
`;


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


parser = extargsparse.ExtArgsParse({
    help_func: function (ec, s) {
        'use strict';
        var fp;
        if (ec === 0) {
            fp = process.stdout;
        } else {
            fp = process.stderr;
        }
        fp.write(s);
        trace_exit(ec);
    }
});
tracelog.init_args(parser);
parser.load_command_line_string(command_line);
args = parser.parse_command_line();
tracelog.set_args(args);


if (args.args !== undefined && Array.isArray(args.args) && typeof args.args[0] === 'string' && args.args[0].length > 0) {
    url = args.args[0];
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