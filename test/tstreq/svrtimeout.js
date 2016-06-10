var express = require('express');
var extargsparse = require('../../extargsparse');
var tracelog = require('../../tracelog');
var util = require('util');
var app;

var command_line = `
    {
        "port|p"  : 9000,
        "timeout|t" : 5000,
        "$" : 0
    }
`;
var parser, args;

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
    }, args.timeout);
    return;
};


app = express();
app.use(handler_request);

tracelog.info('listen on %d', args.port);
app.listen(args.port);