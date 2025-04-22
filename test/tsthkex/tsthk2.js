/*
GET https://www1.hkexnews.hk/search/prefix.do?=&callback=callback&lang=EN&type=A&name=01024&market=SEHK
return
callback({"more":"1","stockInfo":[{"stockId":1000077859,"code":"01024","name":"KUAISHOU-W"}]});

POST https://www1.hkexnews.hk/search/titlesearch.xhtml
with data
lang=EN&market=SEHK&searchType=0&documentType=&t1code=&t2Gcode=&t2code=&stockId=1000077859&from=19990401&to=20250421&category=0&title=

return value list of file


*/


var jstracer = require('jstracer');
var grabwork = require('../../grabwork');
var baseop = require('../../baseop');
var util = require('util');
//var util = require('util');
var grab = grabwork();
var download_pre = require('../../grabwork/download_pre');
var random_delay = require('../../grabwork/random_delay');
var extargsparse = require('extargsparse');
var hk2stockid = require('./hk2_stockid');
var hk2list = require('./hk2_list');
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
        "grabmaxsock|m" : 10,
        "grabtimeout|t" : 10000,
        "startdate|S" : "19990101",
        "downloadmax|M" : 5,
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
var idproc = hk2stockid(args);
var hk2proc = hk2list(args);
grab.add_post(idproc);
grab.add_post(hk2proc);


args.args.forEach(function (elm) {
    'use strict';
    idproc.start_code(elm);
});
