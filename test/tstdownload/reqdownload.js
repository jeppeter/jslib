var jstracer = require('jstracer');
var util = require('util');
var request = require('request');
var extargsparse = require('extargsparse');
var fs = require('fs');
var downloadjob = require('./downloadjob');


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
    "input|i" : null,
    "output|o" : null,
    "downloadmax|M" : 3,
    "directory|d" : null,
    "download<download_handler>##to download files##" : {
        "$" : 0
    }
}
`;
var command_line;
var parser;


var download_end = function (err) {
    'use strict';
    if (err) {
        trace_exit(5);
    } else {
        trace_exit(0);
    }
};

var download_file = function (url, file, callback) {
    'use strict';
    var wf = fs.createWriteStream(file);
    var reqopt = {};
    reqopt.url = url;
    reqopt.method = 'GET';
    jstracer.info('will download [%s]', url);
    var res = request(reqopt);
    //jstracer.info('res\n%s', util.inspect(res, {depth: 3}));
    res.on('response', function () {
        if (res.req.res.statusCode !== 200) {
            var err3 = util.format('statusCode %s', res.req.res.statusCode);
            callback(err3, file, url);
        }
    });
    res.on('error', function (err) {
        wf.close();
        callback(err, file, url);
    });
    res.on('data', function (chunk) {
        wf.write(chunk);
    });
    res.on('end', function () {
        wf.close();
        callback(null, file, url);
    });
    res.on('timeout', function () {
        var err2 = util.format('timed out');
        wf.close();
        callback(err2, file, url);
    });
    res.on('abort', function () {
        var err2 = util.format('aborted');
        wf.close();
        callback(err2, file, url);
    });
};


var download_handler = function (args) {
    'use strict';
    jstracer.set_args(args);
    var djobs = downloadjob(args);
    djobs.start_download(download_file, download_end);
    return;
};

exports.download_handler = download_handler;

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

command_line = util.format(command_line_format);
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
    trace_exit(coderr);
});


parser.parse_command_line();


