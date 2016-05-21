var tracelog = require('../tracelog');
var urlparse = require('url');
var path = require('path');
var fs = require('fs');
var baseop = require('../baseop');
//var util = require('util');

function createDownloadPre() {
    'use strict';
    var hknews = {};
    hknews.workingfiles = [];
    hknews.finish_callback = function (worker, err, next) {
        if (!baseop.is_valid_string(worker.reqopt, 'downloaddir')) {
            next(err);
            return;
        }

        if (baseop.is_in_array(hknews.workingfiles, worker.downloadfile)) {
            /*we should remove the */
            hknews.workingfiles = baseop.remove_array(hknews.workingfiles, worker.downloadfile);
        } else {
            tracelog.warn('<%s> not in workingfiles', worker.downloadfile);
        }

        if (err) {
            /*this is error code so we should make return*/
            if (baseop.is_valid_string(worker, 'url', 1)) {
                var trytimes = 0;
                if (typeof worker.reqopt.hkexnewsdownloadtries === 'number') {
                    trytimes = worker.reqopt.hkexnewsdownloadtries;
                }
                trytimes += 1;
                if (trytimes < 5) {
                    tracelog.warn('[%d]request (%s) again', trytimes, worker.url);
                    worker.parent.queue(worker.url, {
                        downloaddir: worker.reqopt.downloaddir,
                        hkexnewsdownloadtries: trytimes
                    });
                } else {
                    tracelog.error('request (%s) failed totally', worker.url);
                }
            }
        }

        next(err);
        return;
    };

    hknews.pre_handler = function (err, worker, next) {
        var getfilename, getdir;
        var fname;
        var fdir;

        if (!baseop.is_valid_string(worker.reqopt, 'downloaddir', 0)) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }
        if (err) {
            /*if we have nothing to do*/
            tracelog.error('downloaddir (%s) error(%s)', worker.reqopt.downloaddir, JSON.stringify(err));
            worker.url = '';
            next(false, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
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
        fname = worker.reqopt.downloaddir;
        fname += path.sep;
        fname += getfilename;
        if (!baseop.is_in_array(hknews.workingfiles, fname)) {
            fdir = path.dirname(fname);
            worker.downloadfile = fname;
            hknews.workingfiles.push(fname);
            baseop.mkdir_safe(fdir, function (err) {
                if (err) {
                    tracelog.error('can not mkdir(%s)', fdir);
                    worker.url = '';
                    next(false, err);
                    return;
                }
                /*we make sure the timeout not let it out*/
                worker.reqopt.timeout = 10000 * 1000;
                worker.pipe = fs.createWriteStream(fname);
                next(false, null);
                return;
            });
            return;
        }
        tracelog.info('worker set url<%s> null', worker.url);
        /*the file is already handled ,so we do not handle this any more*/
        worker.url = '';
        next(true, null);
        return;
    };

    return hknews;
}


module.exports = createDownloadPre;