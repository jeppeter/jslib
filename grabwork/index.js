var request = require('request');
var tracelog = require('../tracelog');
//var util = require('util');

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
            if (p.workers.indexOf(worker) >= 0) {
                p.workers = p.workers.filter(function (e) {
                    return e !== worker;
                });
            }
            worker.parent = null;
        }
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


function createGrabwork() {
    'use strict';
    var self = {};
    self.workers = [];
    self.pre_handlers = [];
    self.post_handlers = [];
    self.domain_request = {};

    self.request_work = function (worker) {
        var reqopt = worker.reqopt.reqopt || {};
        var url = worker.url;
        var meth = worker.meth.toUpperCase();

        if (url.length === 0) {
            /*we should not handle any more if no url request*/
            worker.finish(null);
            return;
        }
        reqopt.url = url;
        reqopt.method = meth;
        if (worker.pipe !== null) {
            /*we should on end to finish the */
            worker.pipe.on('close', function () {
                worker.finish(null);
            });
            worker.pipe.on('error', function (err) {
                worker.finish(err);
            });

            request(reqopt).pipe(worker.pipe);
        } else {
            request(reqopt, function (err, resp, body) {
                if (err === null) {
                    worker.response = resp;
                    worker.htmldata = body;
                }
                worker.post_next(true, err);
            });
        }
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