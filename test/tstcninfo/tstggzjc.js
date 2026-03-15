var jstracer = require('jstracer');
var grabwork = require('../../grabwork');
var baseop = require('../../baseop');
var util = require('util');
var createGgzjc = require('./ggzjc');
var download_pre = require('../../grabwork/download_pre');
var random_delay = require('../../grabwork/random_delay');
var extargsparse = require('extargsparse');
var curdate;
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
    "listoutput" : null,
    "listinput" : null,
    "pagenum|N" : 1,
    "pagesize|Z" : 30,
    "maxcnt|C" : 50,
    "randommin" : 100,
    "randommax" : 1000,
    "enddate|E" : "%s",
    "topdir|P" : "%s",
    "downloadmax|M" : 30,
    "watermark|w" : 50,
    "url|U" : "https://datacenter-web.eastmoney.com/api/data/v1/",
    "$" : "?"
}
`;

/*
example url
https://datacenter-web.eastmoney.com/api/data/v1/get?callback=datatable3037658&reportName=RPT_EXECUTIVE_HOLD_DETAILS&columns=ALL&quoteColumns=&filter=&pageNumber=32&pageSize=50&sortTypes=-1,1,1&sortColumns=CHANGE_DATE,SECURITY_CODE,PERSON_NAME&source=WEB&client=WEB&p=32&pageNo=32&pageNum=32&_=1773474776305
*/
var command_line;
var parser;
var args;
var grab = grabwork({});
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
grab = grabwork(args);

grab.add_pre(random_delay());
grab.add_pre(download_pre(args));
ggzjc = createGgzjc(args);
grab.add_post(ggzjc);

ggzjc.post_url(1);
