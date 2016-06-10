var request = require('request');
var tracelog = require('../../tracelog');
var extargsparse = require('../../extargsparse');
var util = require('util');
var URL = require('url');
var path = require('path');
var baseop = require('../../baseop');
var fs = require('fs');
var parser;

var command_line = `
    {
        "timeout|t" : 5000,
        "jsonfile|j" : "",
        "get<get_command>## urls... : to get url by request ##" : {
            "$" : "+"
        },
        "pipe<pipe_command>## url [file] : to download url to file ##" : {
            "$" : "+"
        },
        "post<post_command>## urls... : to post data to urls ##" : {
            "$" : "+",
            "data" : "",
            "file" : ""
        }
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


var get_command = function (args) {
    'use strict';
    var errcode = 0;
    var urls = args.subnargs;
    tracelog.set_args(args);
    tracelog.info('urls(%d) %s', urls.length, urls);
    baseop.read_json_parse(args.jsonfile, function (err, opt) {
        if (err) {
            tracelog.error('can not read (%s)', args.jsonfile);
            trace_exit(3);
            return;
        }
        urls.forEach(function (elm, idx) {
            request.get(elm, opt, function (err2, resp2, body2) {
                if (err2) {
                    errcode = 3;
                } else {
                    console.log('<%d:%s> htmls(%s)', idx, elm, body2);
                    tracelog.info('<%d:%s> htmls(%s)', idx, elm, body2);
                }
                resp2 = resp2;
                if (idx === (urls.length - 1)) {
                    trace_exit(errcode);
                }
            });
        });
    });
};
exports.get_command = get_command;

var pipe_command = function (args) {
    'use strict';
    var ws;
    var url = args.subnargs[0];
    var outfile = null;

    if (args.subnargs.length > 1) {
        outfile = args.subnargs[1];
    }

    if (outfile === null) {
        parser = URL.parse(url);
        outfile = parser.pathname;
        outfile = path.basename(outfile);
        outfile = __dirname + path.sep + outfile;
    }
    tracelog.set_args(args);

    baseop.read_json_parse(args.jsonfile, function (err, opt) {
        if (err) {
            console.error('can not parse (%s) error(%s)', args.jsonfile, JSON.stringify(err));
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
};
exports.pipe_command = pipe_command;

var post_command = function (args) {
    'use strict';
    var errcode = 0;
    var postdata = '';
    var urls = args.subnargs;
    tracelog.set_args(args);
    tracelog.info('urls(%d) %s', urls.length, urls);
    postdata = '';
    if (baseop.is_valid_string(args, 'post_data')) {
        postdata = args.post_data;
    }
    if (baseop.is_valid_string(args, 'post_file')) {
        fs.readFile(args.post_file, function (err2, data) {
            if (err2) {
                tracelog.error('can not read (%s) (%s)', args.post_file, JSON.stringify(err2));
                trace_exit(3);
                return;
            }
            postdata = data;
            baseop.read_json_parse(args.jsonfile, function (err, opt) {
                if (err) {
                    tracelog.error('can not read (%s) (%s)', args.jsonfile, JSON.stringify(err));
                    trace_exit(3);
                    return;
                }
                if (!baseop.is_non_null(opt, 'body')) {
                    opt.body = postdata;
                }
                if (postdata.length > 0) {
                    opt.body = postdata;
                }
                urls.forEach(function (elm, idx) {
                    request.post(elm, opt, function (err3, resp3, body3) {
                        if (err3) {
                            errcode = 3;
                        } else {
                            tracelog.info('<%d:%s> htmls(%s)', idx, elm, body3);
                            tracelog.info('<%d:%s> headers(%s)', idx, elm, util.inspect(resp3.headers, {
                                showHidden: true,
                                depth: null
                            }));
                        }
                        resp3 = resp3;
                        if (idx === (urls.length - 1)) {
                            trace_exit(errcode);
                        }
                    });
                });
            });
        });
    } else {
        baseop.read_json_parse(args.jsonfile, function (err, opt) {
            if (err) {
                tracelog.error('can not read (%s) (%s)', args.jsonfile, JSON.stringify(err));
                trace_exit(3);
                return;
            }
            if (!baseop.is_non_null(opt, 'body')) {
                opt.body = postdata;
            }
            if (postdata.length > 0) {
                opt.body = postdata;
            }
            urls.forEach(function (elm, idx) {
                request.post(elm, opt, function (err4, resp4, body4) {
                    if (err4) {
                        errcode = 3;
                    } else {
                        tracelog.info('<%d:%s> htmls(%s)', idx, elm, body4);
                        tracelog.info('<%d:%s> headers(%s)', idx, elm, util.inspect(resp4.headers, {
                            showHidden: true,
                            depth: null
                        }));
                    }
                    resp4 = resp4;
                    if (idx === (urls.length - 1)) {
                        trace_exit(errcode);
                    }
                });
            });
        });
    }
};
exports.post_command = post_command;



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

parser.load_command_line_string(command_line);
tracelog.init_args(parser);
parser.parse_command_line();