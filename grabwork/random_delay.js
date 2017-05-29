var crypto = require('crypto');
//var util = require('util');
var baseop = require('../baseop');


function createRandomDelay(options) {
    'use strict';
    var hknews = {};

    hknews.options = {};
    hknews.options.watermark = 20;
    if (baseop.is_non_null(options, 'watermark') && options.watermark < 256) {
        hknews.options.watermark = options.watermark;
    }

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
            if (num > hknews.options.watermark) {
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
            if (num > hknews.options.watermark) {
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