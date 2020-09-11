var jstracer = require('jstracer');
var grabwork = require('../../grabwork');
var baseop = require('../../baseop');
var util = require('util');
var cninfonewmain = require('./cninfo_n3main');
var cninfonewquery = require('./cninfo_n3query');
var cninfostockcode = require('./cninfo_n3code');
var download_pre = require('../../grabwork/download_pre');
var random_delay = require('../../grabwork/random_delay');
var extargsparse = require('extargsparse');
var curdate;
var cninfomain;
var cninfoquery;
var d = new Date();

curdate = '';
curdate += baseop.number_format_length(4, d.getFullYear());
curdate += '-';
curdate += baseop.number_format_length(2, d.getMonth() + 1);
curdate += '-';
curdate += baseop.number_format_length(2, d.getDate());



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

var command_line_format = `
    {
        "grabmaxsock|m" : 50,
        "grabtimeout|t" : 5000,
        "startdate|S" : "2000-01-01",
        "pagenum|N" : 1,
        "pagesize|Z" : 30,
        "maxcnt|C" : 5,
        "randommin" : 0,
        "randommax" : 1000,
        "enddate|E" : "%s",
        "topdir|P" : "%s",
        "downloadmax|M" : 30,
        "watermark|w" : 50,
        "url|U" : "http://www.cninfo.com.cn/cninfo-new/disclosure/szse/showFulltext/",
        "$" : "+"
    }
`;
var command_line;
var parser;
var args;

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

var curdir = __dirname;
curdir = curdir.replace(/\\/g, '\\\\');
command_line = util.format(command_line_format, curdate, curdir);
parser.load_command_line_string(command_line);
jstracer.init_args(parser);

process.on('uncaughtException', function (err) {
    'use struct';
    jstracer.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', function () {
    'use strict';
    trace_exit(3);
});

process.on('exit', function (coderr) {
    'use strict';
    if (coderr === 0) {
        grab.assert_exit_dump();
    }
    trace_exit(coderr);
});

args = parser.parse_command_line();
jstracer.set_args(args);
var grab = grabwork(args);

grab.add_pre(random_delay());
grab.add_pre(download_pre(args));
cninfomain = cninfonewmain(args);
grab.add_post(cninfomain);
cninfoquery = cninfonewquery(args);
grab.add_post(cninfoquery);

callback_func = function(code) {
    try{
        var jdata;
        var codefmt;
        jdata = JSON.parse(code);
        codefmt = {};
        if (!baseop.is_non_null(jdata['stockList'])) {
            jstracer.error('no stockList in\n%s',code);
            trace_exit(3);
            return;
        }

        jdata['stockList'].forEach(function(elm,idx) {
            if(!baseop.is_non_null(elm['orgId']) ||
                !baseop.is_non_null(elm['code']) ||
                !baseop.is_non_null(elm['zwjc'])) {
                jstracer.warn('[%d] no orgId or code\n%s', idx,util.inspect(elm,{
                    showHidden: true,
                    depth: null
                }));
            } else {
                jstracer.trace('[%s] [%s]=[%s] [%s]',idx,elm['code'],elm['orgId'],elm['zwjc'])
                codefmt[elm['code']] = {};
                codefmt[elm['code']].orgId = elm['orgId'];
                codefmt[elm['code']].name = elm['zwjc'];
            }
        });

        args.args.forEach(function(elm,idx) {
            if (!baseop.is_non_null(codefmt[elm])) {
                jstracer.warn('stock code %s not find', elm);
            } else {
                cninfomain.post_queue_url(elm,codefmt[elm].orgId,codefmt[elm].name);
            }
        });
    }
    catch(e) {
        jstracer.error('parse error %s\n%s', e, code);
        trace_exit(3);
        return;
    }
};

stockcode = cninfostockcode(args.maxcnt,callback_func);

grab.add_post(stockcode);

stockcode.get_code();

