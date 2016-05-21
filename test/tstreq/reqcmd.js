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
        commander.subname = 'get';
        tracelog.set_commander(options.parent);
        tracelog.info('args(%d) %s', args.length, args);
        if (args.length === 0) {
            usage(3, commander, 'please specify at lease one url');
        }
        args.forEach(function (elm, idx) {
            tracelog.info('request (%s)', elm);
            request({
                method: 'GET',
                timeout: options.parent.timeout,
                url: elm
            }, function (error, response, body) {
                if (error) {
                    tracelog.error('request (%d:%s) error (%s)', idx, elm, JSON.stringify(error));
                    trace_exit(3);
                    return;
                }
                response = response;
                tracelog.info('<%d:%s>body(%s)', idx, elm, body);
                trace_exit(0);
                return;
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
        request.get(url, {
            timeout: options.timeout
        }, function (err) {
            if (err) {
                tracelog.error('<%s> error(%s)', url, JSON.stringify(err));
                return;
            }
        }).pipe(ws);
        return;

    });

tracelog.init_commander(commander);
commander.parse(process.argv);

if (commander.subname.length === 0) {
    usage(3, commander, 'please specify a command');
}