var jstracer = require('jstracer');
var extargsparse = require('extargsparse');
//var keepagent = require('keep-alive-agent');
var http = require('http');
http.globalAgent.keepAlive = 1;
var url = 'http://127.0.0.1:9000/';
var util = require('util');
var URL = require('url');
var parser, args;
var command_line = `
{
    "$" : "?"
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
jstracer.init_args(parser);
parser.load_command_line_string(command_line);
args = parser.parse_command_line();
jstracer.set_args(args);

if (args.args !== undefined && Array.isArray(args.args) && typeof args.args[0] === 'string' && args.args[0].length > 0) {
    url = args.args[0];
}

var hostname;
var portnum;
var parserurl;
var hagent;

parserurl = URL.parse(url);
hostname = parserurl.hostname;
portnum = parserurl.port;
hagent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 3000
});
jstracer.info('hostname %s portnum %d pathname %s', hostname, portnum, parserurl.pathname);
var getOptions = {
    hostname: hostname,
    port: portnum,
    path: parserurl.pathname,
    //agent: hagent,
    headers: {
        connection: 'Keep-Alive'
    }
};

jstracer.info('getOptions (%s)', util.inspect(getOptions, {
    showHidden: true,
    depth: null
}));

var req;
req = http.get(getOptions, function (reps) {
    'use strict';
    jstracer.info('resp %s', util.inspect(reps, {
        showHidden: true,
        depth: null
    }));
    http.get(getOptions, function (resp2) {
        jstracer.info('resp %s', util.inspect(resp2, {
            showHidden: true,
            depth: null
        }));
        trace_exit(0);
    });
});

req.on('error', function (err) {
    'use strict';
    jstracer.error('error (%s)', JSON.stringify(err));
});