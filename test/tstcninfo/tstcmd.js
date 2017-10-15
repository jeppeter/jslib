var jstracer = require('jstracer');
var grabwork = require('../../grabwork');
var baseop = require('../../baseop');
var util = require('util');
//var util = require('util');
var grab = grabwork();
var cninfomain = require('./cninfo_main');
var cninfoquery = require('./cninfo_query');
var download_pre = require('../../grabwork/download_pre');
var random_delay = require('../../grabwork/random_delay');
var extargsparse = require('extargsparse');
var curdate;
var d = new Date();

curdate = '';
curdate += baseop.number_format_length(4, d.getFullYear());
curdate += baseop.number_format_length(2, d.getMonth() + 1);
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
        "grabmaxsock|m" : 1,
        "grabtimeout|t" : 5000,
        "startdate|S" : "19990101",
        "randommin" : 5000,
        "randommax" : 7000,
        "enddate|E" : "%s",
        "topdir|P" : "%s",
        "downloadmax|M" : 1,
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
    trace_exit(0);
});

args = parser.parse_command_line();
jstracer.set_args(args);


grab.add_pre(random_delay());
grab.add_pre(download_pre(args));
//grab.add_post(random_delay(args));
grab.add_post(cninfomain(args));
grab.add_post(cninfoquery(args));
var mainurl;
mainurl = args.url + args.stockcode;
jstracer.info('url (%s)', mainurl);

args.args.forEach(function (code) {
    'use strict';
    grab.queue(mainurl, {
        cninfomain: code
    });
});