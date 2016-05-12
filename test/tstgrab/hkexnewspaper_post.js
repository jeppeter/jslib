var tracelog = require('../../tracelog');

function createHkexNewsPaperPost() {
    'use strict';
    var hknews = {};

    hknews.post_handler = function (err, worker, next) {
        tracelog.trace('newspaper');
        if (err) {
            /*if we have nothing to do*/
            next(true, err);
            return;
        }

        if (worker.reqopt.hkexnewspaper === undefined || worker.reqopt.hkexnewspaper === null || !worker.reqopt.hknexnewspaper) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        tracelog.trace('request paper');
        next(false, null);
    };

    return hknews;
}


module.exports = createHkexNewsPaperPost;