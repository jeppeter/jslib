var tracelog = require('../../tracelog');
var baseop = require('../../baseop');
var gitcheerio = require('./gitcheerio');
var URL = require('url');
var path = require('path');

var creategithubdirPost = function (opt) {
    'use strict';
    var githubdirpost = {};


    githubdirpost.state = {};
    githubdirpost.state.success = 0;
    githubdirpost.state.failed = 0;
    githubdirpost.maxconnect = 30;
    githubdirpost.maxerror = 5;
    githubdirpost.maxdepth = 0;
    if (baseop.check_valid_number(opt, 'maxerror')) {
        githubdirpost.maxerror = opt.maxerror;
    }

    if (baseop.check_valid_number(opt, 'maxdepth')) {
        githubdirpost.maxdepth = opt.maxdepth;
    }

    githubdirpost.try_again = function (worker) {
        if (worker.reqopt.githubdir.errors < githubdirpost.maxerror || githubdirpost.maxerror === 0) {
            worker.parent.queue(worker.reqopt.githubdir.url, worker.reqopt);
        }
        return;
    };

    githubdirpost.post_handler = function (err, worker, next) {
        var listdirs;
        if (!baseop.is_non_null(worker.reqopt, 'githubdir') || !baseop.is_valid_string(worker.reqopt.githubdir, 'url')) {
            next(true, err);
            return;
        }
        if (err) {
            worker.reqopt.githubdir.errors += 1;
            githubdirpost.state.failed += 1;
            tracelog.warn('[%d] %s', worker.reqopt.githubdir.errors, worker.reqopt.githubdir.url);
            githubdirpost.try_again(worker);
            next(false, err);
            return;
        }

        githubdirpost.state.success += 1;
        /*now we should get the dirto handle*/
        listdirs = gitcheerio.get_list_dirs(worker.htmldata);
        if (listdirs.length > 0) {
            listdirs.forEach(function (elm) {
                var curdir;
                var urlparse;
                var setdir;
                var diropt;
                var fileopt;
                var url;
                var parent = worker.parent;
                var pathname;
                var j = 0;
                if (elm.type === 'dir') {
                    diropt = {};
                    diropt.githubdir = {};
                    urlparse = URL.parse(worker.url);
                    pathname = urlparse.pathname;
                    diropt.githubdir.depth = worker.reqopt.githubdir.depth;
                    setdir = '';
                    if (elm.href.startsWith(pathname)) {
                        var elmarr, patharr;
                        elmarr = elm.href.split("/");
                        patharr = pathname.split("/");
                        for (j = patharr.length; j < elmarr.length; j += 1) {
                            diropt.githubdir.depth += 1;
                            setdir += path.sep;
                            setdir += elmarr[j];
                        }
                    } else {
                        tracelog.warn('(%s) not startsWith (%s)', elm.href, pathname);
                        setdir += path.sep;
                        setdir += path.basename(elm.href);
                        diropt.githubdir.depth += 1;
                    }
                    curdir = worker.reqopt.githubdir.localdir;
                    curdir += setdir;
                    diropt.githubdir.localdir = curdir;
                    url = urlparse.protocol;
                    url += '//';
                    if (baseop.is_valid_string(urlparse, 'auth')) {
                        url += urlparse.auth;
                        url += '@';
                    }
                    url += urlparse.host;
                    url += elm.href;
                    diropt.githubdir.url = url;
                    /*we start 0 errors*/
                    diropt.githubdir.errors = 0;
                    //tracelog.info('url(%s) dir(%s)', diropt.githubdir.url, diropt.githubdir.localdir);
                    if (githubdirpost.maxdepth === 0 || diropt.githubdir.depth < githubdirpost.maxdepth) {
                        baseop.mkdir_safe(curdir, function (err2) {
                            if (err2) {
                                tracelog.error('can not create(%s) error(%s)', curdir, err2);
                                return;
                            }
                            parent.queue(diropt.githubdir.url, diropt);
                            return;
                        });
                    } else {
                        tracelog.warn('%s exceed maxdepth (%d)', diropt.githubdir.url, githubdirpost.maxdepth);
                    }
                } else {
                    fileopt = {};
                    fileopt.githubfile = {};
                    urlparse = URL.parse(worker.url);
                    url = urlparse.protocol;
                    url += '//';
                    if (baseop.is_valid_string(urlparse, 'auth')) {
                        url += urlparse.auth;
                        url += '@';
                    }
                    url += urlparse.host;
                    url += elm.href;
                    fileopt.githubfile.url = url;
                    fileopt.githubfile.errors = 0;
                    fileopt.githubfile.localdir = worker.reqopt.githubdir.localdir;
                    //tracelog.info('url (%s) filedir(%s)', fileopt.githubfile.url, fileopt.githubfile.localdir);
                    parent.queue(fileopt.githubfile.url, fileopt);
                }
            });
        } else {
            tracelog.warn('(%s) no element', worker.url);
        }
        next(false, null);
        return;
    };

    return githubdirpost;
};

module.exports = creategithubdirPost;