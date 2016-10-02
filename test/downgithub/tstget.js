var extargsparse = require('extargsparse');
var tracelog = require('../../tracelog');
var gitcheerio = require('./gitcheerio');
var fs = require('fs');

var command_line = `
    {
        "$" : "+"
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

var parser = extargsparse.ExtArgsParse({
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


var args;
tracelog.init_args(parser);
parser.load_command_line_string(command_line);
args = parser.parse_command_line(null, parser);
tracelog.set_args(args);
args.args.forEach(function (elm) {
    'use strict';
    fs.readFile(elm, function (err, cont) {
        var listdirs;
        if (err !== null) {
            tracelog.error("can not read (%s) error(%s)", elm, err);
            trace_exit(3);
            return;
        }
        listdirs = gitcheerio.get_list_dirs(cont);

    });
});