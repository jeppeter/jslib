var crypto = require('crypto');
var util = require('util');
var baseop = require('../baseop');


function createRandomDelay(options) {
    'use strict';
    var randompre = {};

    randompre.options = {};
    randompre.options.watermark = 20;
    randompre.options.randommin = 0;
    randompre.options.randommax = 1000;
    if (baseop.is_non_null(options, 'watermark') && options.watermark < 256) {
        randompre.options.watermark = options.watermark;
    }

    if (baseop.is_non_null(options, 'randommin')) {
        randompre.options.randommin = options.randommin;
    }

    if (baseop.is_non_null(options, 'randommax')) {
        randompre.options.randommax = options.randommax;
    }

    if (randompre.options.randommin >= randompre.options.randommax) {
        throw new Error(util.format('please use random min(%s) >= max(%s)', randompre.options.randommin, randompre.options.randommax));
    }

    randompre.pre_handler = function (err, worker, next) {
        if (err) {
            next(true, err);
            return;
        }
        if (baseop.is_non_null(worker.reqopt, 'delayoption')) {
            if (baseop.is_non_null(worker.reqopt.delayoption, 'nodelay')) {
                next(true, null);
                return;
            }
            if (baseop.is_non_null(worker.reqopt.delayoption, 'delaymills')) {
                setTimeout(function () {
                    next(true, null);
                    return;
                }, worker.reqopt.delayoption.delaymills);
                return;
            }
        }
        crypto.randomBytes(4, function (err2, buffer2) {
            var hex;
            var num;
            var randtime;
            if (err2) {
                next(true, null);
                return;
            }
            hex = buffer2.toString('hex');
            num = parseInt(hex, 16);
            num %= 256;
            if (num > randompre.options.watermark) {
                crypto.randomBytes(4, function (err3, buffer3) {
                    if (err3) {
                        next(true, null);
                        return;
                    }
                    hex = buffer3.toString('hex');
                    randtime = parseInt(hex, 16);
                    randtime %= (randompre.options.randommax - randompre.options.randommin);
                    randtime += randompre.options.randommin;
                    setTimeout(function () {
                        next(true, null);
                        return;
                    }, randtime);
                });
                return;
            }
            next(true, null);
            return;
        });
    };

    /*randompre.post_handler = function (err, worker, next) {
        if (err) {
            next(true, err);
            return;
        }
        worker = worker;
        crypto.randomBytes(4, function (err2, buffer2) {
            var hex;
            var num;
            if (err) {
                next(true, null);
                return;
            }
            hex = buffer2.toString('hex');
            num = parseInt(hex, 16);
            num %= 256;
            if (num > randompre.options.watermark) {
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
    };*/

    return randompre;
}


module.exports = createRandomDelay;