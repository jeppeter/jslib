var grabcheerio = require('./grabcheerio');
var jstracer = require('jstracer');
var URL = require('url');
var path = require('path');
var baseop = require('../../baseop');
var grabwork = require('../../grabwork');

function createHkexNewsPaperPost(options) {
    'use strict';
    var hknews = {};
    hknews.options = {};
    hknews.options.maxtries = 0;

    if (baseop.is_non_null(options, 'maxtries') && typeof options.maxtries === 'number' && options.maxtries >= 0) {
        hknews.options.maxtries = options.maxtries;
    }

    hknews.post_handler = function (err, worker, next) {
        var pdfs;
        var i;
        var curpdf;
        var pathname;
        var setdir;
        var urlparse;
        var extension;
        var downdir;
        var sendreqopt;
        //jstracer.trace('newspaper');

        if (!baseop.is_non_null(worker.reqopt, 'hkexnewsextendoption')) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        if (err) {
            var trytimes = 0;
            /*if we have nothing to do*/
            sendreqopt = worker.reqopt;
            if (typeof sendreqopt.hkexnewsextendoption.trytimes === 'number') {
                trytimes = sendreqopt.hkexnewsextendoption.trytimes;
            }
            trytimes += 1;
            if (trytimes < hknews.options.maxtries || hknews.options.maxtries === 0) {
                sendreqopt.hkexnewsextendoption.trytimes = trytimes;
                jstracer.warn('[%d]<%s>', trytimes, worker.url);
                worker.parent.queue(worker.url, sendreqopt);
            } else {
                jstracer.error('really error on extend(%s)', worker.url);
            }

            next(true, err);
            return;
        }


        /*now it is time ,we handle ,so we should no more to handle out*/
        //jstracer.trace('request paper');
        //jstracer.info('htmldata %s', worker.htmldata);
        pdfs = grabcheerio.more_query_html(worker.htmldata);
        if (pdfs.length === 0) {

            /*we find nothing to handle*/
            jstracer.info('<%s> pdfs 0', worker.url);
            next(false, null);
            return;
        }


        urlparse = URL.parse(worker.url);
        pathname = urlparse.pathname;
        setdir = path.basename(pathname);
        extension = path.extname(setdir);
        setdir = setdir.replace(extension, '');

        downdir = worker.reqopt.hkexnewsextendoption.downloaddir;
        downdir += path.sep;
        downdir += setdir;
        for (i = 0; i < pdfs.length; i += 1) {
            curpdf = grabcheerio.combine_dir(worker.url, pdfs[i]);
            if (baseop.match_expr_i(curpdf, '\.pdf$')) {
                worker.parent.download_queue(curpdf, downdir, {
                    priority: grabwork.MAX_PRIORITY
                });
            }

        }
        next(false, null);
        return;
    };

    return hknews;
}


module.exports = createHkexNewsPaperPost;