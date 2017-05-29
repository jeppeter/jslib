var grabcheerio = require('./grabcheerio');
var fs = require('fs');
var extargsparse = require('extargsparse');
var jstracer = require('jstracer');
var util = require('util');
var parser;



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

var query_command = function (args) {
    'use strict';
    var html = args.subnargs[0];
    jstracer.set_args(args);
    fs.readFile(html, function (err, data) {
        var list_result;
        if (err) {
            jstracer.error('read %s (%s)', html, JSON.stringify(err));
            trace_exit(3);
            return;
        }
        list_result = grabcheerio.find_query_result(data);
        jstracer.info('list_result (%s)', util.inspect(list_result));
        trace_exit(0);
        return;
    });
};

exports.query_command = query_command;

var morequery_command = function (args) {
    'use strict';
    var html = args.subnargs[0];
    jstracer.set_args(args);
    fs.readFile(html, function (err, data) {
        var list_result;
        if (err) {
            jstracer.error('read %s (%s)', html, JSON.stringify(err));
            trace_exit(3);
            return;
        }
        list_result = grabcheerio.more_query_html(data);
        jstracer.info('list_result (%s)', util.inspect(list_result));
        trace_exit(0);
        return;
    });
};

exports.morequery_command = morequery_command;

var combind_command = function (args) {
    'use strict';
    var retval;
    var url = args.subnargs[0];
    var pdf = args.subnargs[1];
    jstracer.set_args(args);
    retval = grabcheerio.combine_dir(url, pdf);
    console.log('<%s> <%s> = <%s>', url, pdf, retval);
};

exports.combind_command = combind_command;

var command_line = `
    {
        "query<query_command>## html : to get the query ##" : {
            "$" : 1
        },
        "morequery<morequery_command>## html : to get more query ##" : {
            "$" : 1
        },
        "combind<combind_command>## url pdf : to combind ##" : {
            "$" : 2
        }
    }
`;

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