var tracelog = require('../../tracelog');
var urlparse = require('url');
var path = require('path');
var fs = require('fs');
var baseop = require('../../baseop');

function createHkexNewsDownloadPre() {
    'use strict';
    var hknews = {};
    hknews.workingfiles = [];
    hknews.finish_callback = function (worker, err, next) {
        if (baseop.is_valid_string(worker.reqopt, 'hkexnewsdownloaddir')) {
            next(err);
            return;
        }


        if (worker.hkexnewsdownloadfile !== null && worker.hkexnewsdownloadfile !== undefined && worker.hkexnewsdownloadfile.length > 0 && hknews.workingfiles.indexOf(worker.hkexnewsdownloadfile) >= 0) {
            /*we should remove the */
            hknews.workingfiles = baseop.remove_array(hknews.workingfiles, worker.hkexnewsdownloadfile);
        }

        if (err) {
            /*this is error code so we should make return*/
            if (baseop.is_valid_string(worker, 'url')) {
                tracelog.warn('request (%s) again', worker.url);
                worker.parent.queue(worker.url, {
                    hkexnewsdownloaddir: worker.reqopt.hkexnewsdownloaddir
                });
            }
        }

        next(err);
        return;
    };

    hknews.pre_handler = function (err, worker, next) {
        var getfilename, getdir;
        var fname;
        var fdir;
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
        getdir = urlparse.parse(worker.url);
        getfilename = path.basename(getdir.pathname);

        if (getfilename.length === 0) {
            tracelog.error('can not get from path (%s)', worker.reqopt.url);
            /*we can not download any more*/
            worker.reqopt.url = '';
            next(false, null);
            return;
        }
        worker.add_finish(hknews.finish_callback);
        fname = worker.reqopt.hkexnewsdownloaddir;
        fname += path.sep;
        fname += getfilename;
        if (!baseop.is_in_array(hknews.workingfiles, fname)) {
            fdir = path.dirname(fname);
            tracelog.info('get (%s) => (%s)(%s)', worker.url, fname, fdir);
            worker.hkexnewsdownloadfile = fname;
            hknews.workingfiles.push(fname);
            baseop.mkdir_safe(fdir, function (err) {
                if (err) {
                    worker.url = '';
                    next(false, err);
                    return;
                }
                worker.pipe = fs.createWriteStream(fname);
                next(false, null);
                return;
            });
            return;
        }
        /*the file is already handled ,so we do not handle this any more*/
        worker.url = '';
        next(true, null);
        return;
    };

    return hknews;
}


module.exports = createHkexNewsDownloadPre;