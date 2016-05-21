var crypto = require('crypto');
var tracelog = require('../../tracelog');
var util = require('util');

var is_pdf_down_worker = function (worker) {
    'use strict';
    if (/\.pdf$/.test(worker.url)) {
        return true;
    }
    return false;
};


function createRandomDelay() {
    'use strict';
    var hknews = {};

    hknews.pre_handler = function (err, worker, next) {
        if (err) {
            next(true, err);
            return;
        }
        worker = worker;
        crypto.randomBytes(1, function (err, buffer) {
            var hex;
            var num;
            if (err) {
                next(true, null);
                return;
            }
            hex = buffer.toString('hex');
            num = parseInt(hex, 16);
            num %= 256;
            if (num > 20) {
                setTimeout(function () {
                    next(true, null);
                    return;
                }, num * 20);
                return;
            }
            next(true, null);
            return;
        });
    };

    hknews.post_handler = function (err, worker, next) {
        if (err) {
            next(true, err);
            return;
        }
        if (is_pdf_down_worker(worker)) {
            tracelog.info('<%s>reqopt (%s)', worker.url, util.inspect(worker.reqopt, {
                showHidden: true,
                depth: null
            }));
        }
        crypto.randomBytes(1, function (err, buffer) {
            var hex;
            var num;
            if (err) {
                next(true, null);
                return;
            }
            hex = buffer.toString('hex');
            num = parseInt(hex, 16);
            num %= 256;
            if (num > 20) {
                setTimeout(function () {
                    next(true, null);
                    return;
                }, num * 20);
                return;
            }
            next(true, null);
            return;
        });
        return;
    };

    return hknews;
}


module.exports = createRandomDelay;