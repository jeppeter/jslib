var grabwork = require('../../grabwork/index');
var extargsparse = require('extargsparse');
var tracelog = require('../../tracelog');
var download_pre = require('../../grabwork/download_pre');
var util = require('util');
var fs = require('fs');
var gitcheerio = require('./gitcheerio');
var githubdir_post = require('./githubdir_post');
var githubfile_post = require('./githubfile_post');

var command_line_fmt = `{
    "path|P" : "%s",
    "input|i" : null,
    "output|o" : null,
    "maxerrors|e" : 5,
    "maxdepth|d" : 0,
    "list<list_handler>##html... : to get github dir tree from html##" : {
        "$" : "+"
    },
    "dump<dump_handler>##urls... to dump urls##" : {
        "$" : "+"
    },
    "url<url_handler>##html... : to parse github url in html##" : {
        "$" : "+"
    },
    "download<download_handler>##urls... : to download github part dir##" : {
        "$" : "+"
    }
}`;
var curdir = __dirname;
curdir = curdir.replace(/\\/g, '\\\\');

var command_line = util.format(command_line_fmt, curdir);

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
    parser = parser;
    tracelog.set_args(args);
    args.subnargs.forEach(function (elm) {
        fs.readFile(elm, function (err, cont) {
            var listdirs;
            if (err !== null) {
                tracelog.error("can not read (%s) error(%s)", elm, err);
                trace_exit(3);
                return;
            }
            listdirs = gitcheerio.get_list_dirs(cont);
            listdirs.forEach(function (elm, idx) {
                tracelog.info('[%d] <%s> %s', idx, elm.type, elm.href);
            });
        });
    });
    return;
};

exports.dump_handler = function (args, parser) {
    'use strict';
    var grab = grabwork(args);
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

exports.url_handler = function (args, parser) {
    'use strict';
    parser = parser;
    tracelog.set_args(args);
    args.subnargs.forEach(function (elm, idx) {
        fs.readFile(elm, function (err, cont) {
            var url;
            if (err !== null) {
                tracelog.error("can not read (%s) error(%s)", elm, err);
                trace_exit(3);
                return;
            }
            url = gitcheerio.get_raw_url(cont);
            tracelog.info('[%d] %s', idx, url);
        });
    });
};

exports.download_handler = function (args, parser) {
    'use strict';
    var grab = grabwork(args);
    parser = parser;
    tracelog.set_args(args);
    grab.add_post(githubdir_post(args));
    grab.add_post(githubfile_post(args));
    grab.add_pre(download_pre(args));
    args.subnargs.forEach(function (elm) {
        var opt;
        opt = {};
        opt.githubdir = {};
        opt.githubdir.localdir = args.path;
        opt.githubdir.url = elm;
        opt.githubdir.errors = 0;
        opt.githubdir.depth = 0;
        grab.queue(elm, opt);
    });
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