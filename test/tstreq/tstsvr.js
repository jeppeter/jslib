var http = require('http');
var util = require('util');
var tracelog = require('../../tracelog');
var extargsparse = require('../../extargsparse');
var parser, args;

var command_line = `
{
    "port|p" : 9000,
    "$" : 0
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
tracelog.init_args(parser);
parser.load_command_line_string(command_line);
args = parser.parse_command_line();
tracelog.set_args(args);

http.createServer(function (req, resp) {
    'use strict';
    tracelog.info('req headers (%s)', util.inspect(req.headers, {
        showHidden: true,
        depth: null
    }));
    resp = resp;

    req.on('end', function () {
        tracelog.info('end req');
    }).on('error', function (err) {
        tracelog.info('error (%s)', JSON.stringify(err));
    }).on('data', function (chunk) {
        tracelog.info('data (%s)', chunk);
    });

}).listen(args.port);
tracelog.info('listen on %d', args.port);