var request = require('request');
var tracelog = require('../../tracelog');
var commander = require('commander');
var util = require('util');
var URL = require('url');
var path = require('path');
var baseop = require('../../baseop');
var fs = require('fs');
commander.subname = '';
commander.subopt = {};
commander.subargs = [];

commander
    .version('0.2.0')
    .option('-t --timeout <timeout>', 'timeout value', function (v, t) {
        'use strict';
        t = t;
        return parseInt(v);
    }, 5000)
    .option('-j --jsonfile <jsonfile>', 'jsonfile to set for the request option default (\'\')', function (v, t) {
        'use strict';
        t = t;
        return v;
    }, '')
    .usage('[options] <url...>');

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


commander
    .command('get <url...>')
    .description(' get htmldata from url')
    .action(function (args, options) {
        'use strict';
        var errcode = 0;
        commander.subname = 'get';
        tracelog.set_commander(options.parent);
        tracelog.info('args(%d) %s', args.length, args);
        if (args.length === 0) {
            usage(3, commander, 'please specify at lease one url');
        }
        baseop.read_json_parse(options.jsonfile, function (err, opt) {
            if (err) {
                tracelog.error('can not read (%s)', options.jsonfile);
                trace_exit(3);
                return;
            }
            args.forEach(function (elm, idx) {
                request.get(elm, opt, function (err2, resp2, body2) {
                    if (err2) {
                        errcode = 3;
                    } else {
                        console.log('<%d:%s> htmls(%s)', idx, elm, body2);
                    }
                    resp2 = resp2;
                    if (idx === (args.length - 1)) {
                        trace_exit(errcode);
                    }
                });
            });
        });
    });

commander
    .command('pipe <url> [outfile]')
    .option('--timeout <timemills>', 'time mills for download', function (t, v) {
        'use strict';
        if (baseop.is_valid_number(t) && !baseop.is_valid_float(t)) {
            return baseop.parse_num(t);
        }
        return v;
    }, 30000)
    .description(' downfile to file')
    .action(function (url, outfile, options) {
        'use strict';
        var parser;
        var ws;
        commander.subname = 'pipe';
        if (options === null || options === undefined) {
            options = outfile;
            outfile = null;
        }

        if (outfile === null || outfile === undefined) {
            parser = URL.parse(url);
            outfile = parser.pathname;
            outfile = path.basename(outfile);
            outfile = __dirname + path.sep + outfile;
        }
        tracelog.set_commander(options.parent);

        baseop.read_json_parse(options.parent.jsonfile, function (err, opt) {
            if (err) {
                console.error('can not parse (%s) error(%s)', options.parent.jsonfile, JSON.stringify(err));
                trace_exit(3);
                return;
            }

            ws = fs.createWriteStream(outfile);
            ws.on('error', function (err) {
                tracelog.error('parse <%s> error(%s)', outfile, JSON.stringify(err));
                trace_exit(3);
                return;
            });
            ws.on('close', function () {
                tracelog.info('<%s> closed', url);
                trace_exit(0);
                return;
            });
            request.get(url, opt, function (err2) {
                if (err2) {
                    tracelog.error('<%s> error(%s)', url, JSON.stringify(err2));
                    trace_exit(3);
                    return;
                }
            }).pipe(ws);
        });
        return;

    });

commander
    .command('post <url...>')
    .description(' get htmldata from url')
    .action(function (args, options) {
        'use strict';
        var errcode = 0;
        commander.subname = 'post';
        tracelog.set_commander(options.parent);
        tracelog.info('args(%d) %s', args.length, args);
        if (args.length === 0) {
            usage(3, commander, 'please specify at lease one url');
        }
        baseop.read_json_parse(options.parent.jsonfile, function (err, opt) {
            if (err) {
                tracelog.error('can not read (%s) (%s)', options.parent.jsonfile, JSON.stringify(err));
                trace_exit(3);
                return;
            }
            args.forEach(function (elm, idx) {
                request.post(elm, opt, function (err2, resp2, body2) {
                    if (err2) {
                        errcode = 3;
                    } else {
                        tracelog.info('<%d:%s> htmls(%s)', idx, elm, body2);
                        tracelog.info('<%d:%s> headers(%s)', idx, elm, util.inspect(resp2.headers, {
                            showHidden: true,
                            depth: null
                        }));
                    }
                    resp2 = resp2;
                    if (idx === (args.length - 1)) {
                        trace_exit(errcode);
                    }
                });
            });
        });
    });


tracelog.init_commander(commander);
commander.parse(process.argv);

if (commander.subname.length === 0) {
    usage(3, commander, 'please specify a command');
}