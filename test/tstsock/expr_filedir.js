var fileop = require('./lib/filehandle');
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


module.exports.init_get_file = function (directory, req, port, indexejs) {
    'use strict';
    var host, hostarr;
    var method = req.method;
    method = method.toLowerCase();
    if (method === 'get') {
        req.get_file = {};
        req.get_file.basedir = directory;
        req.get_file.url = req.url;
        host = req.headers.host;
        hostarr = host.split(':');
        host = hostarr[0];
        host = util.format('http://%s:%d', host, port + 1);
        req.get_file.host = host;
        req.get_file.indexejs = indexejs;
    } else if (method === 'put' || method === 'post') {
        req.put_file = {};
        req.put_file.basedir = directory;
        req.put_file.url = req.url;
    }
    return;
};

module.exports.get_request = function (req, res, next) {
    'use strict';
    var inputjson;
    var host;
    var indexejs;
    if (req.get_file === undefined || req.get_file === null) {
        tracelog.trace('');
        next();
        return;
    }

    if (req.get_file.basedir === undefined || req.get_file.basedir === '') {
        tracelog.trace('');
        next();
        return;
    }

    if (req.get_file.url === undefined || req.get_file.url === '') {
        tracelog.trace('');
        next();
        return;
    }


    if (req.get_file.host === undefined || req.get_file.host === '') {
        tracelog.trace('');
        next();
        return;
    }

    if (req.get_file.indexejs === undefined || req.get_file.indexejs === '') {
        tracelog.trace('');
        next();
        return;
    }

    inputjson = {};
    host = req.get_file.host;
    indexejs = req.get_file.indexejs;
    inputjson.basedir = req.get_file.basedir;
    inputjson.requrl = req.get_file.url;
    fileop.list_dir(inputjson, req, res, function (err, outputjson, req, res) {
        var s;
        if (err) {
            res.writeHead(500);
            res.end(JSON.stringify(err));
            tracelog.error(JSON.stringify(err));
            return;
        }

        if (outputjson.hashandled) {
            /*to no handle this*/
            tracelog.trace('');
            return;
        }

        outputjson.url = req.url;
        outputjson.host = host;
        handle_ejsdata(indexejs, function (err, data2) {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify(err));
                tracelog.error(JSON.stringify(err));
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

module.exports.put_file = function (req, res, next) {
    'use strict';
    var inputjson = {};
    if (req.put_file === undefined || req.put_file === null) {
        tracelog.trace('');
        next();
        return;
    }

    if (req.put_file.basedir === undefined || req.put_file.basedir === '') {
        tracelog.trace('');
        next();
        return;
    }

    if (req.put_file.url === undefined || req.put_file.url === '') {
        tracelog.trace('');
        next();
        return;
    }

    inputjson.basedir = req.put_file.basedir;
    inputjson.requrl = req.put_file.url;
    fileop.put_file(inputjson, req, res, function (err, outputjson, req, res) {
        if (err) {
            res.writeHead(500);
            res.write(JSON.stringify(err));
            res.end();
            return;
        }
        outputjson = outputjson;
        req = req;

        res.writeHead(200);
        res.write('success');
        res.end();
        return;

    });
    return;
};