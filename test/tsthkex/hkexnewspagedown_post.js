var jstracer = require('jstracer');
var cheerio = require('cheerio');

function createHkexNewsPageDownPost() {
    'use strict';
    var hknews = {};

    hknews.post_handler = function (err, worker, next) {
        var parser, ahrefs, i, aref;
        jstracer.trace('pagedownload');
        if (err) {
            /*if we have nothing to do*/
            next(true, err);
            return;
        }

        if (worker.reqopt.hkexnewspagedown === undefined || worker.reqopt.hkexnewspagedown === null || worker.reqopt.hkexnewspagedown.length === 0) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        jstracer.trace('hkexnewspagedown %s', worker.reqopt.hkexnewspagedown);
        /*we should give */
        parser = cheerio.load(worker.htmldata);
        ahrefs = parser('a');

        for (i = 0; i < ahrefs.length; i += 1) {
            aref = ahrefs[i];
            if (aref.attribs !== null && aref.attribs !== undefined) {
                if (aref.attribs.href !== null && aref.attribs.href !== undefined && aref.attribs.href.length > 0) {
                    /*it is the href to test if ended with pdf file*/
                    if (/\.pdf$/.test(aref.attribs.href)) {
                        jstracer.info('will download %s', aref.attribs.href);
                    }
                }
            }
        }

        /*will not continue*/
        next(false, null);
    };

    return hknews;
}


module.exports = createHkexNewsPageDownPost;