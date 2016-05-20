var grabcheerio = require('./grabcheerio');
var tracelog = require('../../tracelog');
var URL = require('url');
var path = require('path');

function createHkexNewsPaperPost() {
    'use strict';
    var hknews = {};

    hknews.post_handler = function (err, worker, next) {
        var pdfs;
        var i;
        var curpdf;
        var pathname;
        var setdir;
        var urlparse;
        var extension;
        //tracelog.trace('newspaper');
        if (err) {
            /*if we have nothing to do*/
            tracelog.info('err (%s)', JSON.stringify(err));
            next(true, err);
            return;
        }

        if (worker.reqopt.hkexnewsextenddir === undefined || worker.reqopt.hkexnewsextenddir === null || worker.reqopt.hkexnewsextenddir.length === 0) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        //tracelog.trace('request paper');
        //tracelog.info('htmldata %s', worker.htmldata);
        pdfs = grabcheerio.more_query_html(worker.htmldata);
        if (pdfs.length === 0) {
            /*we find nothing to handle*/
            tracelog.info('<%s> pdfs 0', worker.url);
            next(false, null);
            return;
        }


        urlparse = URL.parse(worker.url);
        pathname = urlparse.pathname;
        setdir = path.basename(pathname);
        extension = path.extname(setdir);
        setdir = setdir.replace(extension, '');

        for (i = 0; i < pdfs.length; i += 1) {
            curpdf = grabcheerio.combine_dir(worker.url, pdfs[i]);
            tracelog.info('[%d] setdir (%s) curdir (%s)', i, setdir, curpdf);

        }
        next(false, null);
        return;
    };

    return hknews;
}


module.exports = createHkexNewsPaperPost;