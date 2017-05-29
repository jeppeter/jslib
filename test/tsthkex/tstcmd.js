var jstracer = require('jstracer');
var grabwork = require('../../grabwork');
var baseop = require('../../baseop');
var util = require('util');
//var util = require('util');
var grab = grabwork();
var hkexnewsmain_post = require('./hkexnewsmain_post');
var hkexnewspaper_post = require('./hkexnewspaper_post');
var hkexnewsextend_post = require('./hkexnewsextend_post');
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

var command_line_format = `
    {
        "grabmaxsock|m" : 10,
        "grabtimeout|t" : 10000,
        "startdate|S" : "19990101",
        "enddate|E" : "%s",
        "stockcode|s" : "02010",
        "topdir|P" : "%s",
        "watermark|w" : 20,
        "url|U" : "http://www.hkexnews.hk/listedco/listconews/advancedsearch/search_active_main_c.aspx"
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


grab.add_pre(random_delay(args));
grab.add_pre(download_pre(args));
grab.add_post(random_delay(args));
grab.add_post(hkexnewsmain_post(args));
grab.add_post(hkexnewspaper_post(args));
grab.add_post(hkexnewsextend_post(args));

jstracer.info('url (%s)', args.url);

grab.queue(args.url, {
    hkexnewsmainoption: {},
    reqopt: {
        timeout: args.grabtimeout
    }
});