var tracelog = require('../../tracelog');
var urlparse = require('url');
var path = require('path');
var fs = require('fs');

function createHkexNewsDownloadPre() {
    'use strict';
    var hknews = {};
    hknews.pre_handler = function (err, worker, next) {
        var getfilename, getdir;
        var ws, fname;
        if (err) {
            /*if we have nothing to do*/
            next(true, err);
            return;
        }

        if (worker.reqopt.hkexnewsdownloaddir === undefined || worker.reqopt.hkexnewsdownloaddir === null || worker.reqopt.hkexnewsdownloaddir.length === 0) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        tracelog.trace('download dir', worker.reqopt.hkexnewsdownloaddir);
        getdir = urlparse.parse(worker.reqopt.url);
        getfilename = path.basename(getdir);

        if (getfilename.length === 0) {
            tracelog.error('can not get from path (%s)', worker.reqopt.url);
            /*we can not download any more*/
            worker.reqopt.url = '';
            next(false, null);
            return;
        }

        fname = worker.reqopt.hkexnewsdownloaddir;
        fname += path.sep;
        fname += getfilename;
        ws = fs.createWriteStream(fname);
        tracelog.info('get (%s) => (%s)', worker.reqopt.url, fname);
        /*we do not need any more*/
        worker.pipe = ws;
        return;
    };

    return hknews;
}


module.exports = createHkexNewsDownloadPre;