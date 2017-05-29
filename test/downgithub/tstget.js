var extargsparse = require('extargsparse');
var jstracer = require('jstracer');
var gitcheerio = require('./gitcheerio');
var fs = require('fs');

var command_line = `
    {
        "$" : "+"
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
jstracer.init_args(parser);
parser.load_command_line_string(command_line);
args = parser.parse_command_line(null, parser);
jstracer.set_args(args);
args.args.forEach(function (elm) {
    'use strict';
    fs.readFile(elm, function (err, cont) {
        var listdirs;
        if (err !== null) {
            jstracer.error("can not read (%s) error(%s)", elm, err);
            trace_exit(3);
            return;
        }
        listdirs = gitcheerio.get_list_dirs(cont);
        listdirs.forEach(function (elm, idx) {
            jstracer.info('[%d] <%s> %s', idx, elm.type, elm.href);
        });
    });
});