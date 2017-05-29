var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var util = require('util');
var jstracer = require('jstracer');
var formidable = require('formidable');



function FileInfo(link, name, isdir, size) {
    'use strict';
    link = link.replace(/%2F/g, '/');
    this.href = link;
    this.displayname = name;
    if (isdir) {
        this.type = 'dir';
        this.size = 0;
    } else {
        this.type = 'file';
        this.size = size;
    }
    //jstracer.info('link(%s) name (%s)', this.href, this.displayname);
    return this;
}


module.exports.list_dir = function (inputjson, req, res, callback) {
    'use strict';
    var outputjson;
    var outerr;
    var outfile;
    var requrl;
    var basedir;
    var posix_dir;
    basedir = inputjson.basedir;
    posix_dir = basedir.split(path.sep).join('/');
    outputjson = {};
    outputjson.lists = [];
    outputjson.hashandled = false;
    if (typeof inputjson.requrl !== 'string' || inputjson.requrl.length === 0) {
        outerr = new Error('no requrl ');
        return callback(outerr, outputjson, req, res);
    }
    requrl = inputjson.requrl;
    outfile = basedir + requrl;
    outerr = null;
    fs.stat(outfile, function (err, stats) {
        var rstream;
        if (err) {
            outerr = new Error(util.format('read %s error(%s)', outfile, JSON.stringify(err)));
            return callback(outerr, outputjson, req, res);
        }

        if (stats.isDirectory()) {
            var pdir;
            var scancnt, hascnt;
            var curelm;
            fs.readdir(outfile, function (err, files) {
                if (err) {
                    outerr = new Error('read (%s) error(%s)', outfile, JSON.stringify(err));
                    return callback(outerr, outputjson, req, res);
                }
                //jstracer.info('req %s', requrl);
                pdir = util.format('%s%s/..', posix_dir, requrl);
                pdir = pdir.replace(/[\/]+/g, path.sep);
                //jstracer.info('pdir %s', pdir);

                pdir = path.resolve(pdir, '.');
                if (pdir.length < basedir.length) {
                    pdir = '/';
                } else {
                    pdir = path.relative(basedir, pdir);
                    pdir = pdir.split(path.sep).join('/');
                    pdir = qs.escape(pdir);
                    jstracer.info('pdir %s', pdir);
                    pdir = '/' + pdir;
                }
                curelm = new FileInfo(pdir, '..', true, 0);
                outputjson.lists.push(curelm);
                scancnt = 0;
                hascnt = 0;
                files.forEach(function (elem) {
                    var lfile;
                    var elmlink, elemstr;
                    lfile = outfile + path.sep + elem;
                    lfile = lfile.split(path.sep).join('/');
                    lfile = lfile.replace(/[\/]+/g, '/');
                    lfile = lfile.split('/').join(path.sep);
                    elemstr = elem;
                    scancnt += 1;
                    if (req.url.length === 1) {
                        fs.stat(lfile, function (err, stats) {
                            hascnt += 1;
                            if (err) {
                                outerr = new Error('%s error(%s)', elem, JSON.stringify(err));
                                return callback(outerr, outputjson, req, res);
                            }
                            elem = elem.split(path.sep).join('/');
                            elmlink = '/' + qs.escape(elem);
                            jstracer.info('%s stats ', lfile);
                            if (stats.isDirectory()) {
                                curelm = new FileInfo(elmlink, elemstr, true, 0);
                            } else {
                                curelm = new FileInfo(elmlink, elemstr, false, stats.size);
                            }
                            outputjson.lists.push(curelm);
                            if (scancnt === hascnt) {
                                return callback(null, outputjson, req, res);
                            }
                        });
                    } else {
                        fs.stat(lfile, function (err, stats) {
                            hascnt += 1;
                            if (err) {
                                outerr = new Error(util.format('%s error(%s)', elem, JSON.stringify(err)));
                                return callback(outerr, outputjson, req, res);
                            }
                            elmlink = requrl + '/' + elem;
                            elmlink = elmlink.split(path.sep).join('/');
                            elmlink = qs.escape(elmlink);
                            if (stats.isDirectory()) {
                                curelm = new FileInfo(elmlink, elemstr, true, 0);
                            } else {
                                curelm = new FileInfo(elmlink, elemstr, false, stats.size);
                            }
                            outputjson.lists.push(curelm);

                            if (scancnt === hascnt) {
                                return callback(null, outputjson, req, res);
                            }
                        });
                    }
                });

                if (scancnt === hascnt) {
                    return callback(null, outputjson, req, res);
                }

                return;
            });
            return;
        }

        outputjson.hashandled = true;

        rstream = fs.createReadStream(outfile);

        rstream.on('open', function () {
            rstream.pipe(res);
        });

        rstream.on('error', function () {
            res.end();
        });
        rstream.on('end', function () {
            res.end();
        });
        return;
    });
};

module.exports.put_file = function (inputjson, req, res, callback) {
    'use strict';
    var requrl;
    var outdir;
    var form;
    var outputjson;
    var basedir;
    basedir = inputjson.basedir;
    requrl = inputjson.requrl;
    outputjson = {};
    outdir = basedir + requrl;
    outdir = outdir.replace(/\\/g, '/');
    outdir = outdir.replace(/[\/]+/g, path.sep);
    jstracer.info('requrl (%s) outfile (%s)', requrl, outdir);
    form = new formidable.IncomingForm();
    form.multiples = true;
    form.uploadDir = outdir;
    outputjson.outdir = outdir;
    //form.uploadDir = ;
    form.on('file', function (field, file) {
        field = field;
        jstracer.info('create file (%s)', file.name);
        outputjson.file = file.name;
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });

    form.on('error', function (err) {
        jstracer.error('An error has occured: \n' + err);
        callback(err, outputjson, req, res);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function () {
        jstracer.info('end');
        callback(null, outputjson, req, res);
    });

    form.parse(req);
};