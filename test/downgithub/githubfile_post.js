var tracelog = require('../../tracelog');
var baseop = require('../../baseop');
var gitcheerio = require('./gitcheerio');
var URL = require('url');

var creategithubfilePost = function (opt) {
    'use strict';
    var githubfilepost = {};


    githubfilepost.state = {};
    githubfilepost.state.success = 0;
    githubfilepost.state.failed = 0;
    githubfilepost.maxconnect = 30;
    githubfilepost.maxerror = 5;

    if (baseop.is_valid_number(opt, 'maxerror')) {
        githubfilepost.maxerror = opt.maxerror;
    }

    githubfilepost.try_again = function (worker) {
        if (worker.reqopt.githubfile.errors < githubfilepost.maxerror || githubfilepost.maxerror === 0) {
            worker.parent.queue(worker.reqopt.githubfile.url, worker.reqopt);
        }
        return;
    };


    githubfilepost.post_handler = function (err, worker, next) {
        var rawurl;
        if (!baseop.is_non_null(worker.reqopt, 'githubfile') || !baseop.is_valid_string(worker.reqopt.githubfile, 'url')) {
            next(true, err);
            return;
        }
        if (err) {
            worker.reqopt.githubfile.errors += 1;
            githubfilepost.state.failed += 1;
            tracelog.warn('[%d] %s', worker.reqopt.githubfile.errors, worker.reqopt.githubfile.url);
            githubfilepost.try_again(worker);
            next(false, err);
            return;
        }

        githubfilepost.state.success += 1;
        /*now we should get the dirto handle*/
        rawurl = gitcheerio.get_raw_url(worker.htmldata);
        if (rawurl !== null) {
            var urlparse;
            var url;

            urlparse = URL.parse(worker.url);
            url = urlparse.protocol;
            url += '//';
            if (baseop.is_valid_string(urlparse, 'auth')) {
                url += urlparse.auth;
                url += '@';
            }
            url += urlparse.host;
            url += rawurl;
            tracelog.info('url (%s) => dir(%s)', url, worker.reqopt.githubfile.localdir);
            worker.parent.download_queue(url, worker.reqopt.githubfile.localdir);
        } else {
            tracelog.warn('(%s) no elementfile raw', worker.url);
        }
        next(false, null);
        return;
    };

    return githubfilepost;
};

module.exports = creategithubfilePost;