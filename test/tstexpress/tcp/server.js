var extargsparse = require('extargsparse');
var parser;
var args;
var tracelog = require('../../../tracelog');
var net = require('net');
var fs = require('fs');
var mktemp = require('mktemp');
var commandline = `
{
    "port|p" : 447,
    "timesleep|t" : 0,
    "files|f" : [],
    "reserved|r" : false
}
`;

var is_error_valid = function (err) {
    'use strict';
    if (err === undefined || err === null) {
        return false;
    }
    return true;
};

parser = extargsparse.ExtArgsParse();
tracelog.init_args(parser);
parser.load_command_line_string(commandline);
args = parser.parse_command_line();
tracelog.set_args(args);



var write_sock_process = function (sock, rstream, endcallback) {
    'use strict';
    var writed = 0;
    sock.paused = false;
    sock.actpaused = false;
    rstream.on('data', function (chunk) {
        var bret;
        bret = sock.write(chunk, 'binary');
        writed += chunk.length;
        if (!bret) {
            tracelog.info('pause read [%s] (%d)', args.files[0], writed);
            rstream.pause();
            sock.actpaused = true;
        } else if (args.timesleep !== 0) {
            sock.paused = true;
            tracelog.info('pause [%d] (%d)', args.timesleep, writed);
            setTimeout(function () {
                if (sock.paused === true) {
                    sock.paused = false;
                    sock.resume();
                    tracelog.info('paused resume');
                }
            }, args.timesleep);
        }
    });
    rstream.on('error', function (err) {
        tracelog.error('can not read %s error(%s)', args.files[0], err);
        if (endcallback !== null) {
            endcallback(err);
        }
        return;
    });
    rstream.on('end', function () {
        if (endcallback !== null) {
            endcallback(null);
        }
    });
    sock.on('drain', function () {
        if (sock.paused !== true && sock.actpaused === true) {
            tracelog.info('resume not paused');
            rstream.resume();
            sock.actpaused = false;
        } else if (sock.paused === true) {
            tracelog.info('writable on paused time');
        } else {
            tracelog.info('sock no drain');
        }
    });
    sock.on('data', function (chunk) {
        tracelog.info('read data [%s] discard', chunk);
    });
    sock.on('error', function (err3) {
        tracelog.error('sock error (%s)', err3);
        if (endcallback !== null) {
            endcallback(err3);
        }
    });
};

var read_sock_process = function (sock, wstream, endcallback) {
    'use strict';
    var writed = 0;
    sock.paused = false;
    sock.actpaused = false;
    sock.on('data', function (chunk) {
        var bret;
        writed += chunk.length;
        bret = wstream.write(chunk, 'binary');
        if (!bret) {
            tracelog.info('pause sock (%d)', writed);
            sock.pause();
            sock.actpaused = true;
        } else if (args.timesleep > 0) {
            tracelog.info('timesleep [%d]', args.timesleep);
            sock.pause();
            sock.paused = true;
            setTimeout(function () {
                if (sock.paused === true) {
                    sock.paused = false;
                    sock.resume();
                    tracelog.info('resume paused state');
                }
            }, args.timesleep);
        }
        return;
    });
    sock.on('error', function (err) {
        tracelog.error('read error(%s)', err);
        if (endcallback !== null) {
            endcallback(err);
        }
        return;
    });
    sock.on('end', function () {
        tracelog.info('sock ended');
        if (endcallback !== null) {
            endcallback(null);
        }
    });

    wstream.on('drain', function () {
        if (sock.paused !== true && sock.actpaused === true) {
            sock.resume();
            sock.actpaused = false;
            tracelog.info('resume without paused');
        } else if (sock.paused === true) {
            tracelog.info('sock is paused');
        } else {
            tracelog.info('no reason drain');
        }
    });

    wstream.on('error', function (err5) {
        tracelog.error('write error(%s)', err5);
        if (endcallback !== null) {
            endcallback(err5);
        }
    });
    return;
};

net.createServer(function (sock) {
    'use strict';
    tracelog.info('remote %s %d', sock.remoteAddress, sock.remotePort);
    if (args.files.length > 0) {
        var rstream = null;
        sock.paused = false;
        rstream = fs.createReadStream(args.files[0], 'binary');
        write_sock_process(sock, rstream, function (err) {
            err = err;
            if (sock !== null) {
                sock.end();
            }
            sock = null;
            if (rstream !== null) {
                rstream.close();
            }
            rstream = null;
        });
    } else {
        var wstream = null;
        mktemp.createFile('XXXXXX.serverwrite', function (err, path) {
            if (is_error_valid(err)) {
                tracelog.error('can not create tempfile %s', err);
                sock.end();
                sock = null;
                return;
            }
            wstream = fs.createWriteStream(path, 'binary');
            tracelog.info('write [%s]', path);
            read_sock_process(sock, wstream, function (err2) {
                if (sock !== null) {
                    sock.end();
                }
                sock = null;
                if (wstream !== null) {
                    wstream.end();
                }
                wstream = null;
                if (!is_error_valid(err2)) {
                    fs.lstat(path, function (err3, fstat) {
                        if (!is_error_valid(err3)) {
                            tracelog.info('[%s] size %d', path, fstat.size);
                            if (args.reserved !== true) {
                                fs.unlink(path, function (err4) {
                                    if (is_error_valid(err4)) {
                                        tracelog.error('can not remove [%s] error(%s)', path, err4);
                                    } else {
                                        tracelog.info('remove %s', path);
                                    }
                                });
                            }
                            return;
                        }
                        if (args.reserved !== true) {
                            fs.unlink(path, function (err4) {
                                if (is_error_valid(err4)) {
                                    tracelog.error('can not remove [%s] error(%s)', path, err4);
                                } else {
                                    tracelog.info('remove %s', path);
                                }
                            });
                        }
                    });
                    return;
                }
                if (args.reserved !== true) {
                    fs.unlink(path, function (err3) {
                        if (is_error_valid(err3)) {
                            tracelog.error('can not remove [%s] error(%s)', path, err3);
                        } else {
                            tracelog.info('remove %s', path);
                        }
                    });
                }
            });
        });
    }
}).listen(args.port);
tracelog.info('listen on %d', args.port);