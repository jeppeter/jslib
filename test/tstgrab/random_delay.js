var crypto = require('crypto');


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
            if (num > 120) {
                setTimeout(function () {
                    next(true, null);
                    return;
                }, num * 10);

            }
            return;
        });
    };

    return hknews;
}


module.exports = createRandomDelay;