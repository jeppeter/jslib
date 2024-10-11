var request = require('request');
var jstracer = require('jstracer');
var extargsparse = require('extargsparse');
var util = require('util');
var URL = require('url');
var path = require('path');
var baseop = require('../../baseop');
var fs = require('fs');
var CryptoJS = require('crypto-js');
var zlib = require('zlib');
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
    },
    "reqcninfo4<reqcninfo4_command>##stockcode ... : to get stock code value##" : {
        "$" : "+"
    }
}
`;


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


var get_command = function (args) {
    'use strict';
    var errcode = 0;
    var urls = args.subnargs;
    jstracer.set_args(args);
    jstracer.info('urls(%d) %s', urls.length, urls);
    baseop.read_json_parse(args.jsonfile, function (err, opt) {
        if (err) {
            jstracer.error('can not read (%s)', args.jsonfile);
            trace_exit(3);
            return;
        }
        urls.forEach(function (elm, idx) {
            request.get(elm, opt, function (err2, resp2, body2) {
                if (err2) {
                    errcode = 3;
                } else {
                    console.log('<%d:%s> htmls(%s)', idx, elm, body2);
                    jstracer.info('<%d:%s> htmls(%s)', idx, elm, body2);
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
    jstracer.set_args(args);

    baseop.read_json_parse(args.jsonfile, function (err, opt) {
        if (err) {
            console.error('can not parse (%s) error(%s)', args.jsonfile, JSON.stringify(err));
            trace_exit(3);
            return;
        }

        ws = fs.createWriteStream(outfile);
        ws.on('error', function (err) {
            jstracer.error('parse <%s> error(%s)', outfile, JSON.stringify(err));
            trace_exit(3);
            return;
        });
        ws.on('close', function () {
            jstracer.info('<%s> closed', url);
            trace_exit(0);
            return;
        });
        request.get(url, opt, function (err2) {
            if (err2) {
                jstracer.error('<%s> error(%s)', url, JSON.stringify(err2));
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
    jstracer.set_args(args);
    jstracer.info('urls(%d) %s', urls.length, urls);
    postdata = '';
    if (baseop.is_valid_string(args, 'post_data')) {
        postdata = args.post_data;
    }
    if (baseop.is_valid_string(args, 'post_file')) {
        fs.readFile(args.post_file, function (err2, data) {
            if (err2) {
                jstracer.error('can not read (%s) (%s)', args.post_file, JSON.stringify(err2));
                trace_exit(3);
                return;
            }
            postdata = data;
            baseop.read_json_parse(args.jsonfile, function (err, opt) {
                if (err) {
                    jstracer.error('can not read (%s) (%s)', args.jsonfile, JSON.stringify(err));
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
                            jstracer.info('<%d:%s> htmls(%s)', idx, elm, body3);
                            jstracer.info('<%d:%s> headers(%s)', idx, elm, util.inspect(resp3.headers, {
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
                jstracer.error('can not read (%s) (%s)', args.jsonfile, JSON.stringify(err));
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
                        jstracer.info('<%d:%s> htmls(%s)', idx, elm, body4);
                        jstracer.info('<%d:%s> headers(%s)', idx, elm, util.inspect(resp4.headers, {
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

var get_cninfo_scode = function () {
    'use strict';
    var dtime = (new Date().getTime() / 1000);
    var stime = CryptoJS.enc.Utf8.parse(Math.floor(dtime));
    var keystr = CryptoJS.enc.Utf8.parse('1234567887654321');
    var encdata = CryptoJS.AES.encrypt(stime, keystr, {iv: keystr, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
    return CryptoJS.enc.Base64.stringify(encdata.ciphertext);
};

var get_cninfo_headers = function () {
    'use strict';
    var headers = {};
    headers.Accept = '*/*';
    headers['Accept-EncKey'] = get_cninfo_scode();
    jstracer.trace('Accept-EncKey %s', headers['Accept-EncKey']);
    headers['Accept-Encoding'] = 'gzip, deflate';
    headers['Accept-Language'] = 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7';
    headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    headers.Host = 'webapi.cninfo.com.cn';
    headers.Origin = 'http://webapi.cninfo.com.cn';
    headers.Referer = 'http://webapi.cninfo.com.cn/';
    headers['X-Requested-With'] = 'XMLHttpRequest';
    return headers;
};

var reqcninfo4_command = function (args) {
    'use strict';
    var conncnt = 0;
    var errmet = 0;
    jstracer.set_args(args);
    args.subnargs.forEach(function (elm) {
        conncnt += 1;
        var reqopt = {};
        reqopt.url = util.format('http://webapi.cninfo.com.cn/api/info/p_info3085?scode=%s', elm);
        reqopt.timeout = args.timeout;
        reqopt.method = 'GET';
        reqopt.headers = get_cninfo_headers();
        request(reqopt, function (err, resp, body) {
            resp = resp;
            if (baseop.is_non_null(err)) {
                conncnt -= 1;
                errmet = 1;
                if (conncnt === 0) {
                    trace_exit(4);
                }
                return;
            }

            if (false) {
                zlib.gunzip(body, function (err2, unzipdata) {
                    if (baseop.is_non_null(err2)) {
                        jstracer.error('err2 %s', err2);
                        conncnt -= 1;
                        errmet = 1;
                        if (conncnt === 0) {
                            trace_exit(4);
                        }
                        return;
                    }
                    jstracer.trace('%s content\n%s', reqopt.url, unzipdata);
                    conncnt -= 1;
                    if (conncnt === 0) {
                        if (errmet === 0) {
                            trace_exit(0);
                        } else {
                            trace_exit(4);
                        }
                    }
                    return;
                });
            } else {
                fs.writeFile('out.data', body, function (err3) {
                    if (baseop.is_non_null(err3)) {
                        conncnt -= 1;
                        errmet = 1;
                        jstracer.error('err3 %s', err3);
                        if (conncnt === 0) {
                            trace_exit(4);
                        }
                        return;
                    }
                    conncnt -= 1;
                    if (conncnt === 0) {
                        if (errmet === 0) {
                            trace_exit(0);
                        } else {
                            trace_exit(4);
                        }
                    }
                    return;
                });
            }

        });
    });

    if (conncnt === 0) {
        trace_exit(0);
    }
    return;
};

exports.reqcninfo4_command = reqcninfo4_command;


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
jstracer.init_args(parser);
parser.parse_command_line();