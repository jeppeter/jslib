var request = require('request');
var tracelog = require('tracelog');

function createWorker(parent, meth, url, reqopt) {
    'use strict';
    var worker = {};
    worker.reqopt = reqopt || {};
    worker.meth = meth;
    worker.url = url;
    worker.parent = parent;
    worker.preidx = 0;
    worker.postidx = 0;
    worker.finish = function () {
        var p;
        if (worker.parent !== null) {
            p = worker.parent;
            if (p.workers.indexOf(worker) >= 0) {
                p.workers = p.workers.filter(function (e) {
                    return e !== worker;
                });
            }
            worker.parent = null;
        }
    };

    worker.pre_next = function (cont, err) {
        if (cont) {
            var idx;
            if (worker.preidx < parent.pre_handlers.length) {
                /*we inc for it will call when*/
                idx = worker.preidx;
                worker.preidx += 1;
                parent.pre_handlers[idx](err, worker, worker.pre_next);
                return;
            }
        }
        worker.preidx = parent.pre_handlers.length;
        return;
    };

    worker.post_next = function (cont, err) {
        if (cont) {
            if (worker.postidx < parent.post_handlers.length) {
                var idx;
                idx = worker.postidx.idx;
                worker.postidx += 1;
                parent.post_handlers[idx](err, worker, worker.post_next);
                return;
            }
        }
        worker.postidx = parent.post_handlers.length;
        /*we finish work*/
        worker.finish();
        return;
    };

    parent.workers.push(worker);
    return worker;
}


function createGrabwork() {
    'use strict';
    var self = {};
    self.workers = [];
    self.pre_handlers = [];
    self.post_handlers = [];

    self.request_work = function (worker) {
        var reqopt = worker.reqopt.request || {};
        var url = worker.url;
        var meth = worker.meth.toUpperCase();

        if (url.length === 0) {
            /*we should not handle any more if no url request*/
            worker.finish();
            return;
        }
        reqopt.url = url;
        reqopt.method = meth;
        request(reqopt, function (err, resp, body) {
            if (err === null) {
                worker.reqopt.response = resp;
                worker.reqopt.htmldata = body;
            }
            worker.post_next(true, err);
        });
    };

    self.queue = function (url, reqopt) {
        var worker = createWorker(self, 'GET', url, reqopt);
        /*we should add*/
        worker.pre_next(true, null);
        self.request_work(worker);
        return self;
    };

    self.post_queue = function (url, reqopt) {
        var worker = createGrabwork(self, 'POST', url, reqopt);
        worker.pre_next(null, true);
        self.request_work(worker);
        return self;
    };

    self.add_pre = function (callback) {
        if (typeof callback !== 'function') {
            tracelog.error('callback (%s) not functions', callback);
            return;
        }

        if (self.pre_handlers.indexOf(callback) >= 0) {
            tracelog.warn('callback (%s) already in', callback);
            return;
        }
        self.pre_handlers.push(callback);
        return;
    };

    self.add_post = function (callback) {
        if (typeof callback !== 'function') {
            tracelog.error('callback (%s) not functions', callback);
            return;
        }

        if (self.post_handlers.indexOf(callback) >= 0) {
            tracelog.warn('callback (%s) already in', callback);
            return;
        }
        self.post_handlers.push(callback);
        return;
    };
    return self;
}


module.exports = createGrabwork;