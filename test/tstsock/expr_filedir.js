var filehandle = require('./lib/filehandle');
var tracelog = require('./lib/tracelog');
var ejs = require('ejs');
var fs = require('fs');
var util = require('util');


var __handle_ejsdata_func = function () {
    'use strict';
    var ejsdata;
    ejsdata = {};

    return function (file, callback) {
        tracelog.trace('call test ejsdata');
        if (ejsdata[file]) {
            tracelog.trace('will put ejsdata (%s)', ejsdata[file]);
            callback(null, ejsdata[file]);
            return ejsdata;
        }
        tracelog.trace('fs read %s', file);
        fs.readFile(file, 'utf-8', function (err, data1) {
            if (err) {
                callback(err, null);
                return;
            }
            ejsdata[file] = data1;
            callback(null, ejsdata[file]);
            return ejsdata;
        });
        return null;
    };
};

var handle_ejsdata = __handle_ejsdata_func();

module.exports.init_filehandle = function (directory, req, port, indexejs) {
    'use strict';
    var host, hostarr;
    req.filehandle = {};
    req.filehandle.basedir = directory;
    req.filehandle.url = req.url;
    host = req.headers.host;
    hostarr = host.split(':');
    host = hostarr[0];
    host = util.format('http://%s:%d', host, port + 1);
    req.filehandle.host = host;
    req.filehandle.indexejs = indexejs;
    return req;
};

module.exports.get_function = function (req, res, next) {
    'use strict';
    var inputjson;
    var host;
    var indexejs;
    if (req.filehandle === undefined || req.filehandle === null) {
        next();
        return;
    }

    if (req.filehandle.basedir === undefined || req.filehandle.basedir === '') {
        next();
        return;
    }

    if (req.filehandle.url === undefined || req.filehandle.url === '') {
        next();
        return;
    }

    if (req.filehandle.ejsfile === undefined || req.filehandle.ejsfile === '') {
        next();
        return;
    }

    if (req.filehandle.host === undefined || req.filehandle.host === '') {
        next();
        return;
    }

    if (req.filehandle.indexejs === undefined || req.filehandle.indexejs === '') {
        next();
        return;
    }

    inputjson = {};
    host = req.filehandle.host;
    indexejs = req.filehandle.indexejs;
    inputjson.basedir = req.filehandle.basedir;
    filehandle.list_dir(inputjson, req, res, function (err, outputjson, req, res) {
        var s;
        if (err) {
            res.writeHead(500);
            res.end(JSON.stringify(err));
            return;
        }

        if (outputjson.hashandled) {
            /*to no handle this*/
            return;
        }

        outputjson.url = req.url;
        outputjson.host = host;
        handle_ejsdata(indexejs, function (err, data2) {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify(err));
                return;
            }
            req = req;
            try {
                s = ejs.render(data2, outputjson);
                res.writeHead(200);
                res.end(s);
                return;
            } catch (e) {
                res.writeHead(500);
                if (typeof e === 'object') {
                    if (err.message) {
                        tracelog.error('error (%s)', err.message);
                    }
                    if (err.stack) {
                        tracelog.error('stack (%s)', err.stack);
                    }
                    tracelog.error('%s', JSON.stringify(err));
                } else {
                    tracelog.error('error %s', err);
                }
                res.end(JSON.stringify(e));
                return;
            }
        });
        return;
    });
    return;
};