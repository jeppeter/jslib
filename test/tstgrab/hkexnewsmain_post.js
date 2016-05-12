var tracelog = require('../../tracelog');
var cheerio = require('cheerio');

function createHkexNewsMainPost() {
    'use strict';
    var hknews = {};

    hknews.post_handler = function (err, worker, next) {
        var parser;
        var inputs;
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
        //tracelog.info('htmldata (%s)', worker.htmldata);
        parser = cheerio.load(worker.htmldata);
        inputs = parser('input');
        tracelog.info('inputs (%d)',inputs.length);

        next(false, null);
    };

    return hknews;
}


module.exports = createHkexNewsMainPost;