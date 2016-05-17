var request = require('request');
var tracelog = require('../../tracelog');
var commander = require('commander');
var url = 'http://127.0.0.1:9000/';
var req = null;
var util = require('util');

commander
    .version('0.2.0')
    .usage('[options] <url>')
    .option('-p --port <port>', 'set port to listen', function (t, v) {
        'use strict';
        t = t;
        return parseInt(v);
    }, 9000);

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

tracelog.init_commander(commander);

commander.parse(process.argv);
tracelog.set_commander(commander);

if (commander.args !== undefined && Array.isArray(commander.args) && typeof commander.args[0] === 'string' && commander.args[0].length > 0) {
    url = commander.args[0];
}

tracelog.info('request (%s)', url);
req = request({
    method: 'GET',
    url: url
}, function (error, response, body) {
    'use strict';
    if (error) {
        tracelog.error('request (%s) error (%s)', url, JSON.stringify(error));
        usage(3, commander, util.format('can not connect (%s)', url));
        return;
    }
    response = response;

    tracelog.info('%s', body);
    if (req !== null) {
        tracelog.info('make anothercall');
        req._callback = null;
        req._callbackCalled = false;
        req.init({
            method: 'GET',
            url: url,
            callback: function (error, response, body) {
                if (error) {
                    tracelog.error('request (%s) error (%s)', url, JSON.stringify(error));
                    trace_exit(3);
                    return;
                }
                tracelog.info('body (%s)', body);
                response.end('');
                trace_exit(0);
                return;
            }
        });
    }
    return;
});

/*tracelog.info('req (%s)', util.inspect(req, {
    showHidden: true,
    depth: null
}));*/