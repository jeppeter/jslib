var tracelog = require('../../tracelog');

function createHkexNewsMainPost() {
    'use strict';
    var hknews = {};

    hknews.post_handler = function (err, worker, next) {
        tracelog.trace('newsmain');
        if (err) {
            /*if we have nothing to do*/
            next(true, err);
            return;
        }

        if (worker.reqopt.hkexnewsmain === undefined || worker.reqopt.hkexnewsmain === null || !worker.reqopt.hkexnewsmain) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        tracelog.trace('request main');
        next(false, null);
    };

    return hknews;
}


module.exports = createHkexNewsMainPost;