var tracelog = require('../tracelog');
var urlparse = require('url');
var path = require('path');
var fs = require('fs');
var baseop = require('../baseop');
//var util = require('util');

function createDownloadPre(options) {
    'use strict';
    var downloadpre = {};
    downloadpre.workingfiles = [];
    downloadpre.pendingfiles = [];
    downloadpre.downloadmax = 30;

    if (baseop.is_non_null(options, 'downloadmax')) {
        downloadpre.downloadmax = options.downloadmax;
    }

    downloadpre.inner_start_download = function (worker, next) {
        var getfilename, getdir;
        var fname;
        var fdir;
        /*now it is time ,we handle ,so we should no more to handle out*/
        getdir = urlparse.parse(worker.url);
        getfilename = path.basename(getdir.pathname);

        if (getfilename.length === 0) {
            tracelog.error('can not get from path (%s)', worker.url);
            /*we can not download any more*/
            worker.reqopt.url = '';
            next(false, null);
            return;
        }
        worker.add_finish(downloadpre.finish_callback);
        fname = worker.reqopt.downloadoption.downloaddir;
        fname += path.sep;
        fname += getfilename;
        if (!baseop.is_in_array(downloadpre.workingfiles, fname)) {
            fdir = path.dirname(fname);
            worker.reqopt.downloadoption.downloadfile = fname;
            downloadpre.workingfiles.push(fname);
            baseop.mkdir_safe(fdir, function (err) {
                if (err) {
                    tracelog.error('can not mkdir(%s)', fdir);
                    worker.url = '';
                    next(false, err);
                    return;
                }
                /*we make sure the timeout not let it out*/
                tracelog.info('start download (%s) (%s)', worker.url, worker.reqopt.downloadoption.downloaddir);
                worker.reqopt.timeout = 1000 * 1000;
                worker.pipe = fs.createWriteStream(fname);
                next(false, null);
                return;
            });
            return;
        }
        tracelog.info('worker <%s> file already in downloading (%s)', worker.url, fname);
        /*the file is already handled ,so we do not handle this any more*/
        worker.url = '';
        next(true, null);
        return;
    };

    downloadpre.inner_pull_download = function () {
        var curpending;
        var retval = 0;
        while (downloadpre.workingfiles.length < downloadpre.downloadmax || downloadpre.downloadmax === 0) {
            if (downloadpre.pendingfiles.length === 0) {
                break;
            }
            curpending = downloadpre.pendingfiles[0];
            downloadpre.pendingfiles = baseop.remove_array(downloadpre.pendingfiles, curpending);
            downloadpre.inner_start_download(curpending.worker, curpending.next);
            curpending = {};
            retval += 1;
        }
        return retval;
    };

    downloadpre.finish_callback = function (worker, err, next) {
        var sendreqopt;
        if (!baseop.is_non_null(worker.reqopt, 'downloadoption') || !baseop.is_non_null(worker.reqopt.downloadoption, 'downloaddir')) {
            next(err);
            return;
        }

        if (baseop.is_in_array(downloadpre.workingfiles, worker.reqopt.downloadoption.downloadfile)) {
            /*we should remove the */
            downloadpre.workingfiles = baseop.remove_array(downloadpre.workingfiles, worker.reqopt.downloadoption.downloadfile);
        } else {
            tracelog.warn('<%s> not in workingfiles', worker.reqopt.downloadoption.downloadfile);
        }

        if (err) {
            /*this is error code so we should make return*/
            if (baseop.is_valid_string(worker, 'url', 1)) {
                var trytimes = 0;
                if (typeof worker.reqopt.downloadoption.downloadtries === 'number') {
                    trytimes = worker.reqopt.downloadoption.downloadtries;
                }
                trytimes += 1;
                sendreqopt = worker.reqopt;
                sendreqopt.downloadoption.downloadtries = trytimes;
                if (trytimes < 5) {
                    tracelog.warn('[%d]request (%s) again', trytimes, worker.url);
                    worker.parent.download_queue(worker.url, sendreqopt);
                } else {
                    tracelog.error('request (%s) failed totally', worker.url);
                }
            }
        } else {
            tracelog.info('<%s> (%s) succ', worker.url, worker.reqopt.downloadoption.downloaddir);
        }


        downloadpre.inner_pull_download();
        next(err);
        return;
    };

    downloadpre.pre_handler = function (err, worker, next) {
        var curpending;
        if (!baseop.is_non_null(worker.reqopt, 'downloadoption') || !baseop.is_non_null(worker.reqopt.downloadoption, 'downloaddir')) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }
        if (err) {
            /*if we have nothing to do*/
            tracelog.error('downloaddir (%s) error(%s)', worker.reqopt.downloadoption.downloaddir, JSON.stringify(err));
            worker.url = '';
            next(false, err);
            return;
        }

        curpending = {};
        curpending.worker = worker;
        curpending.next = next;

        downloadpre.pendingfiles.push(curpending);
        downloadpre.inner_pull_download();
        return;
    };

    return downloadpre;
}


module.exports = createDownloadPre;