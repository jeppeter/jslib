var request = require('request');
var tracelog = require('../tracelog');
var baseop = require('../baseop');
var util = require('util');

var MAX_PRIORITY = 5;
var DEF_PRIORITY = 3;
var MIN_PRIORITY = 1;


function createWorker(parent, meth, url, reqopt) {
    'use strict';
    var worker = {};
    var handler = null;
    worker.reqopt = reqopt || {};
    worker.meth = meth;
    worker.url = url;
    worker.parent = parent;
    worker.preidx = 0;
    worker.postidx = 0;
    worker.finish_callbacks = [];
    worker.finishidx = 0;
    worker.pipe = null;

    worker.next_finish = function (err) {
        var idx;
        var p;
        idx = worker.finishidx;
        if (idx < worker.finish_callbacks.length) {
            worker.finishidx += 1;
            worker.finish_callbacks[idx](worker, err, worker.next_finish);
            return;
        }
        if (worker.parent !== null) {
            p = worker.parent;
            p.remove_request_worker(worker);
            worker.parent = null;
        }
        worker.pipe = null;
        worker.url = '';
        worker.reqopt = {};
        return;
    };
    worker.finish = function (err) {
        worker.next_finish(err);
    };

    worker.add_finish = function (finish_func) {
        if (typeof finish_func !== 'function') {
            tracelog.error('%s not function', finish_func);
            return;
        }

        if (worker.finish_callbacks.indexOf(finish_func) >= 0) {
            tracelog.warn('%s already in', finish_func);
            return;
        }
        worker.finish_callbacks.push(finish_func);
        return;
    };

    worker.pre_next = function (cont, err) {
        if (cont) {
            var idx;
            if (worker.preidx < parent.pre_handlers.length) {
                /*we inc for it will call when*/
                idx = worker.preidx;
                worker.preidx += 1;
                handler = parent.pre_handlers[idx];
                handler.pre_handler(err, worker, worker.pre_next);
                return;
            }
        }
        worker.preidx = parent.pre_handlers.length;
        worker.parent.request_work(worker);
        return;
    };

    worker.post_next = function (cont, err) {
        if (cont) {
            var idx;
            if (worker.postidx < parent.post_handlers.length) {
                idx = worker.postidx;
                worker.postidx += 1;
                handler = parent.post_handlers[idx];
                handler.post_handler(err, worker, worker.post_next);
                return;
            }
        }
        worker.postidx = parent.post_handlers.length;
        /*we finish work*/
        worker.finish(null);
        return;
    };

    parent.workers.push(worker);
    return worker;
}


function createGrabwork(options) {
    'use strict';
    var self = {};
    var setopt = options || {};
    var idx;
    self.workers = [];
    self.pre_handlers = [];
    self.post_handlers = [];
    self.domain_request = {};
    self.grabmaxsock = 30;
    self.grabtimeout = 10000;
    self.reqworkqueue = [];
    self.priorqueue = [];

    for (idx = 0; idx < MAX_PRIORITY; idx += 1) {
        self.priorqueue.push([]);
    }

    if (setopt.grabmaxsock !== null && setopt.grabmaxsock !== undefined && setopt.grabmaxsock >= 0) {
        self.grabmaxsock = setopt.grabmaxsock;
    }

    if (setopt.grabtimeout !== null && setopt.grabtimeout !== undefined && typeof setopt.grabtimeout === 'number' && setopt.grabtimeout >= 0) {
        self.grabtimeout = setopt.grabtimeout;
    }

    self.inner_request_work = function (worker) {
        var reqopt = worker.reqopt.reqopt || {};
        var url = worker.url;
        var meth = worker.meth.toUpperCase();

        if (url.length === 0) {
            /*we should not handle any more if no url request*/
            worker.finish(null);
            return;
        }
        /*we push it into the request queue, as it will work ok*/
        self.reqworkqueue.push(worker);
        if (self.reqworkqueue.length > self.grabmaxsock && self.grabmaxsock !== 0) {
            tracelog.error('length %d grabmaxsock %d', self.reqworkqueue.length, self.grabmaxsock);
        }
        reqopt.url = url;
        reqopt.method = meth;
        self.reqworkqueue.push(worker);
        if (false) {
            tracelog.trace('worker (%s)', util.inspect(worker, {
                showHidden: true,
                depth: 3
            }));
        }
        if (reqopt.timeout === null || reqopt.timeout === undefined) {
            reqopt.timeout = self.grabtimeout;
        }
        if (worker.pipe !== null && worker.pipe !== undefined) {
            /*we should on end to finish the */
            worker.pipe.on('close', function () {
                worker.finish(null);
            });
            worker.pipe.on('error', function (err) {
                tracelog.error('(%s) error(%s)', worker.url, JSON.stringify(err));
                worker.finish(err);
            });

            request(reqopt, function (err) {
                if (err) {
                    tracelog.error('<%s::%s> error(%s)', worker.meth, worker.url, JSON.stringify(err));
                    worker.finish(err);
                    return;
                }
            }).pipe(worker.pipe);
        } else {
            request(reqopt, function (err, resp, body) {
                if (err === null) {
                    worker.response = resp;
                    worker.htmldata = body;
                } else {
                    tracelog.error('(%s) error(%s)', worker.url, JSON.stringify(err));
                }
                worker.post_next(true, err);
            });
        }
        return;
    };

    self.inner_pull_request = function () {
        var getworker;
        var retval = 0;
        var i;
        while (self.reqworkqueue.length < self.grabmaxsock || self.grabmaxsock === 0) {
            getworker = null;
            for (i = 0; i < MAX_PRIORITY; i += 1) {
                if (self.priorqueue[i].length > 0) {
                    getworker = self.priorqueue[i][0];
                    self.priorqueue[i] = baseop.remove_array(self.priorqueue[i], getworker);
                    break;
                }
            }

            if (getworker === null) {
                /*nothing to find*/
                break;
            }

            retval += 1;
            self.inner_request_work(getworker);
        }
        return retval;
    };

    self.remove_request_worker = function (worker) {
        var i;
        var retval = 0;
        for (i = 0; i < MAX_PRIORITY; i += 1) {
            if (self.priorqueue[i].indexOf(worker) >= 0) {
                self.priorqueue[i] = baseop.remove_array(self.priorqueue[i], worker);
                retval += 1;
                break;
            }
        }

        if (self.reqworkqueue.indexOf(worker) >= 0) {
            self.reqworkqueue = baseop.remove_array(self.reqworkqueue, worker);
            retval += 1;
        }

        if (self.workers.indexOf(worker) >= 0) {
            self.workers = baseop.remove_array(self.workers, worker);
        }

        /*we have remove some thing,so we can pull request*/
        self.inner_pull_request();
        return retval;
    };


    self.request_work = function (worker) {
        var priority;
        if (worker.reqopt.priority === null || worker.reqopt.priority === undefined) {
            worker.reqopt.priority = DEF_PRIORITY;
        }

        if (worker.reqopt.priority > MAX_PRIORITY) {
            worker.reqopt.priority = MAX_PRIORITY;
        }

        if (worker.reqopt.priority < MIN_PRIORITY) {
            worker.reqopt.priority = MIN_PRIORITY;
        }
        priority = (worker.reqopt.priority - 1);
        /*we put it into the queue ,so handle it by default*/
        self.priorqueue[priority].push(worker);
        self.inner_pull_request();
        return;
    };

    self.inner_queue = function (meth, url, reqopt) {
        var worker = createWorker(self, meth, url, reqopt);
        if (typeof reqopt.finish_callback === 'function') {
            worker.add_finish(reqopt.finish_callback);
        }
        if (typeof reqopt.notice_callback === 'function') {
            reqopt.notice_callback(null, worker, worker.pre_next);
        } else {
            worker.pre_next(true, null);
        }
        return self;

    };

    self.queue = function (url, reqopt) {
        self.inner_queue('GET', url, reqopt);
        return;
    };

    self.post_queue = function (url, reqopt) {
        self.inner_queue('POST', url, reqopt);
        return;
    };

    self.download_queue = function (url, dirname, opt) {
        var url2 = url;
        var dir2 = dirname;
        var reqopt = {};
        if (baseop.is_non_null(opt)) {
            url2 = url;
            dir2 = dirname;
            reqopt = opt;
        } else if (baseop.is_non_null(dirname)) {
            if (typeof dirname === 'string') {
                url2 = url;
                dir2 = dirname;
            } else {
                if (baseop.is_url_format(url)) {
                    url2 = url;
                    reqopt = dirname;
                } else {
                    url2 = url;
                    dir2 = dirname;
                }
            }
        } else {
            if (typeof url === 'string') {
                if (baseop.is_url_format(url)) {
                    url2 = url;
                } else {
                    dir2 = url;
                }
            } else {
                reqopt = url;
            }
        }

        if (!baseop.is_non_null(reqopt, 'downloadoption')) {
            reqopt.downloadoption = {};
        }

        if (url2 === '') {
            if (baseop.is_non_null(reqopt, 'reqopt')) {
                if (baseop.is_valid_string(reqopt.reqopt, 'url')) {
                    url2 = reqopt.reqopt.url;
                }
            }

            if (!baseop.is_url_format(url2)) {
                tracelog.warn('<no url specified>');
                return;
            }
        }

        if (baseop.is_valid_string(reqopt.downloadoption, 'downloaddir')) {
            if (dir2 !== '' && dir2 !== reqopt.downloadoption.downloaddir) {
                tracelog.warn('downloadoption.downloaddir <%s> != <%s>', reqopt.downloadoption.downloaddir, dir2);
                reqopt.downloadoption.downloaddir = dir2;
            }
        } else {
            if (dir2 === '') {
                tracelog.warn('not specify downloaddir for (%s)', url2);
                dir2 = __dirname;
            }
            reqopt.downloadoption.downloaddir = dir2;
        }

        self.inner_queue('GET', url2, reqopt);
        return;
    };

    self.add_pre = function (handler) {
        if (handler.pre_handler === null || handler.pre_handler === undefined || typeof handler.pre_handler !== 'function') {
            tracelog.error('handler (%s) not functions', handler);
            return;
        }

        if (self.pre_handlers.indexOf(handler) >= 0) {
            tracelog.warn('handler (%s) already in', handler);
            return;
        }
        self.pre_handlers.push(handler);
        return;
    };

    self.add_post = function (handler) {
        if (handler.post_handler === null || handler.post_handler === undefined || typeof handler.post_handler !== 'function') {
            tracelog.error('handler (%s) not valid', handler);
            return;
        }

        if (self.post_handlers.indexOf(handler) >= 0) {
            tracelog.warn('handler (%s) already in', handler);
            return;
        }
        self.post_handlers.push(handler);
        return;
    };

    return self;
}


module.exports = createGrabwork;
module.exports.MAX_PRIORITY = MAX_PRIORITY;
module.exports.MIN_PRIORITY = MIN_PRIORITY;
module.exports.DEF_PRIORITY = DEF_PRIORITY;