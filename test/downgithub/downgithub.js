var grabwork = require('../../grabwork/index');
var extargsparse = require('extargsparse');
var tracelog = require('../../tracelog');
var download_pre = require('../../grabwork/download_pre');
var util = require('util');

var grab = grabwork();
var command_line_fmt = `{
    "path|P" : "%s",
    "input|i" : null,
    "output|o" : null,
    "list<list_handler>" : {
        "$" : "+"
    }

}`;
var curdir = __dirname;
curdir = curdir.replace(/\\/g, '\\\\');

var command_line = util.format(command_line_fmt, curdir);
console.log('cmdline %s', command_line);

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

process.on('SIGINT', function () {
    'use strict';
    trace_exit(0);
});

process.on('exit', function () {
    'use strict';
    trace_exit(0);
});


process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});


exports.list_handler = function (args, parser) {
    'use strict';
    var i, url;
    tracelog.set_args(args);
    parser = parser;
    grab.add_pre(download_pre(args));
    for (i = 0; i < args.subnargs.length; i += 1) {
        url = args.subnargs[i];
        grab.download_queue(url, args.path);
    }
    return;
};



var parser;
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
parser.parse_command_line(null, parser);