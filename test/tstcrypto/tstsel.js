var jstracer = require('jstracer');
var extargsparse = require('extargsparse');
var baseop = require('../../baseop');
var util = require('util');
var d = new Date();
var fs = require('fs');

var curdate = '';
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
    "startdate|S" : "2000-01-01",
    "enddate|E" : "%s",
    "selpdf<selpdf_handler>##to list pdf select##" :{
        "$" : "+"
    }
}`;
var command_line;
var parser;
var args;
//var grab = grabwork({});
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
command_line = util.format(command_line_format, curdate);
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
    //if (coderr === 0) {
        //grab.assert_exit_dump();
    //}
    trace_exit(coderr);
});

var get_url_pdf = function (htmldata) {
    'use strict';
    var dv = JSON.parse(htmldata);
    var retarr = [];
    if (baseop.is_non_null(dv, 'records')) {
        dv.records.forEach(function (cv) {
            if (baseop.is_non_null(cv, 'F003V')) {
                retarr.push(cv.F003V);
            }
        });
    }
    return retarr;
};


var selpdf_handler = function (args) {
    'use strict';
    var connval = 0;
    jstracer.set_args(args);

    args.subnargs.forEach(function (elm) {
        connval += 1;
        fs.readFile(elm, function (err, data) {
            if (baseop.is_non_null(err)) {
                jstracer.error('read %s error %s', elm, err);
                trace_exit(3);
                return;
            }
            var retarr = get_url_pdf(data);
            retarr.forEach(function (cv) {
                var cc = cv.split('/');
                var llen = cc.length;
                jstracer.trace('%s', cc[llen - 2]);
            });
            //jstracer.trace('retarr \n%s', retarr);
            connval -= 1;
            if (connval === 0) {
                trace_exit(0);
            }
        });
    });
    if (connval === 0) {
        trace_exit(0);
    }
    return;
};

exports.selpdf_handler = selpdf_handler;


args = parser.parse_command_line();
jstracer.set_args(args);

