var extargsparse = require('extargsparse');
var parser;
var args;
var tracelog = require('../../../tracelog');
var net = require('net');
var fs = require('fs');
var mktemp = require('mktemp');
var client;
var commandline = `
{
    "port|p" : 447,
    "timesleep|t" : 0,
    "input|i" : null,
    "output|o" : null,
    "$" : "+",
    "reserved|r" : false
}
`;

parser = extargsparse.ExtArgsParse();
tracelog.init_args(parser);
parser.load_command_line_string(commandline);
args = parser.parse_command_line();
tracelog.set_args(args);

if (args.args.length < 2) {
    process.stderr.write('%s need host port', process.argv[1]);
    process.exit(3);
}

var is_error_valid = function (err) {
    'use strict';
    if (err === undefined || err === null) {
        return false;
    }
    return true;
};

client = new net.Socket();

client.connect(args.args[1], args.args[0], function (err) {
    'use strict';
    if (is_error_valid(err)) {
        tracelog.error('connect %s:%s error(%s)', args.args[0], args.args[1], err);
        process.exit(4);
    }
});

var read_file_process = function (client, rstream, endcallback) {
    'use strict';
    var writed = 0;
    rstream.paused = false;
    rstream.actpaused = false;
    rstream.on('data', function (chunk) {
        var bret;
        bret = client.write(chunk, 'binary');
        writed += chunk.length;
        if (!bret) {
            tracelog.info('pause rstream (%d)', writed);
            rstream.pause();
            rstream.actpaused = true;
        } else if (args.timesleep !== 0) {
            rstream.paused = true;
            rstream.pause();
            setTimeout(function () {
                if (rstream.paused === true) {
                    rstream.resume();
                    rstream.paused = false;
                    tracelog.info('paused resume (%d)', writed);
                }
            }, args.timesleep);
        }
    });

    rstream.on('end', function () {
        tracelog.info('rstream end (%d)', writed);
        client.write('end of file', 'binary');
        client.write('\0', 'binary');
        if (endcallback !== null) {
            endcallback(null);
        }
    });
    rstream.on('error', function (err) {
        tracelog.error('read [%s] error(%s)', args.input, err);
        if (endcallback !== null) {
            endcallback(err);
        }
    });
    /*we should send the */
    client.on('data', function (chunk) {
        tracelog.info('read [%s]', chunk);
    });
    client.on('error', function (err) {
        tracelog.info('error %s', err);
        if (endcallback !== null) {
            endcallback(err);
        }
    });

    client.on('drain', function () {
        if (rstream.paused !== true && rstream.actpaused === true) {
            tracelog.info('rstream resume (%d)', writed);
            rstream.resume();
            rstream.actpaused = false;
        } else if (rstream.paused === true) {
            tracelog.info('time sleep paused');
        } else {
            tracelog.info('no reason resume');
        }
    });
};

var write_file_process = function (client, wstream, endcallback) {
    'use strict';
    var writed = 0;
    client.paused = false;
    client.actpaused = false;

    wstream.on('drain', function () {
        if (client.paused !== true && client.actpaused === true) {
            client.resume();
            client.actpaused = false;
            tracelog.info('act paused resume');
        } else if (client.paused === true) {
            tracelog.info('paused not resume');
        } else {
            tracelog.info('no reason drain');
        }
    });

    wstream.on('error', function (err) {
        tracelog.error('write error(%s)', err);
        if (endcallback !== null) {
            endcallback(err);
        }
    });

    client.on('data', function (chunk) {
        var bret;
        bret = wstream.write(chunk, 'binary');
        writed += chunk.length;
        if (!bret) {
            tracelog.info('client pause (%d)', writed);
            client.pause();
            client.actpaused = true;
        } else if (args.timesleep > 0) {
            client.paused = true;
            client.pause();
            tracelog.info('pause [%d](%d)', args.timesleep, writed);
            setTimeout(function () {
                if (client.paused === true) {
                    client.paused = false;
                    client.resume();
                    tracelog.info('client resume');
                }
            }, args.timesleep);
        }
    });
    client.on('error', function (err2) {
        tracelog.error('sock error (%s)', err2);
        if (endcallback !== null) {
            endcallback(err2);
        }
    });

    client.on('end', function () {
        tracelog.info('client ended');
        if (endcallback !== null) {
            endcallback(null);
        }
    });
};

if (args.input !== null) {
    var rstream = null;
    rstream = fs.createReadStream(args.input, 'binary');
    read_file_process(client, rstream, function (err) {
        'use strict';
        err = err;
        if (rstream !== null) {
            rstream.close();
        }
        rstream = null;
        if (client !== null) {
            client.end();
        }
        client = null;
    });
} else {
    if (args.output === null) {
        mktemp.createFile('XXXXXX.clientwrite', function (err, path) {
            'use strict';
            var wstream = null;
            if (is_error_valid(err)) {
                if (client !== null) {
                    client.end();
                }
                client = null;
                tracelog.error('mktemp error (%s)', err);
                return;
            }
            tracelog.info('client [%s]', path);
            wstream = fs.createWriteStream(path, 'binary');

            write_file_process(client, wstream, function (err3) {
                if (wstream !== null) {
                    wstream.close();
                }
                wstream = null;
                if (client !== null) {
                    client.end();
                }
                client = null;
                if (!is_error_valid(err3)) {
                    fs.lstat(path, function (err4, fstat) {
                        if (is_error_valid(err4)) {
                            tracelog.error('state [%s] error(%s)', path, err4);
                            fs.unlink(path, function (err5) {
                                if (is_error_valid(err5)) {
                                    tracelog.error('unlink [%s] error(%s)', path, err5);
                                }
                            });
                            return;
                        }
                        tracelog.info('[%s] file %d', path, fstat.size);
                        if (args.reserved !== true) {
                            fs.unlink(path, function (err6) {
                                if (is_error_valid(err6)) {
                                    tracelog.error('unlink [%s] error(%s)', path, err6);
                                }
                            });
                        }
                    });
                    return;
                }
                if (args.reserved !== true) {
                    fs.unlink(path, function (err7) {
                        if (is_error_valid(err7)) {
                            tracelog.error('can not unlink[%s] error(%s)', path, err7);
                        }
                    });
                }
            });
        });
    } else {
        var wstream = null;
        wstream = fs.createWriteStream(args.output, 'binary');
        write_file_process(client, wstream, function (err2) {
            'use strict';
            if (wstream !== null) {
                wstream.end();
            }
            wstream = null;
            if (client !== null) {
                client.end();
            }
            client = null;
            if (!is_error_valid(err2)) {
                fs.lstat(args.output, function (err3, fstat) {
                    if (is_error_valid(err3)) {
                        tracelog.error('[%s] stat error(%s)', args.output, err3);
                        return;
                    }
                    tracelog.info('[%s] size %d', args.output, fstat.size);
                    return;
                });
            }
            return;
        });
    }
}