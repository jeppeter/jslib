var jstracer = require('jstracer');
var extargsparse = require('extargsparse');
var express = require('express');
var fs = require('fs');
var util = require('util');

var app = express();

var trace_exit = function (ec) {
    'use strict';
    jstracer.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};

var parser = extargsparse.ExtArgsParse({
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
var commandline = `
    {
        "port|p" : 3000,
        "$" : "+"

    }
`;
var args;
var postidx = 0;

parser.load_command_line_string(commandline);
parser = jstracer.init_args(parser);

args = parser.parse_command_line();

jstracer.set_args(args);

process.on('uncaughtException', function (err) {
    'use struct';
    jstracer.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', function () {
    'use strict';
    trace_exit(0);
});

app.post('/vm/vmctrl/power', function (req, res) {
    'use strict';
    var fname;
    req = req;
    if (postidx >= args.args.length) {
        postidx %= args.args.length;
    }
    fname = args.args[postidx];
    fs.readFile(fname, function (err, data) {
        if (err) {
            var errstr;
            errstr = util.format('{ err : "read [%s] %s"}', fname, err);
            res.end(errstr);
            return;
        }
        jstracer.info('send [%s]', data);
        res.end(data);
        return;
    });
    postidx += 1;
    return;
});

app.post('/vm/ceph/vmstat', function (req, res) {
    'use strict';
    var fname;
    req = req;
    if (postidx >= args.args.length) {
        postidx %= args.args.length;
    }
    fname = args.args[postidx];
    fs.readFile(fname, function (err, data) {
        if (err) {
            var errstr;
            errstr = util.format('{err :"read [%s] %s"}', fname, err);
            res.end(errstr);
            return;
        }
        jstracer.info('send [%s]', data);
        res.end(data);
        return;
    });
    postidx += 1;
    return;
});

app.listen(args.port, function () {
    'use strict';
    jstracer.info('listen on %d', args.port);
});