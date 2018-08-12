var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var cheerio = require('cheerio');
var URL = require('url');

function createMain(options) {
    'use strict';
    var mainobj;
    options = options;
    mainobj = {};
    mainobj.options = {};
    mainobj.options.stockcode = '600000';
    mainobj.post_handler = function (err, worker, next) {
        var parser;
        var content;
        var idx;
        //var maxnum = 0;
        var curelm;
        if (!baseop.is_valid_string(worker.reqopt, 'reportmain')) {
            next(true, err);
            return;
        }

        if (err) {
            jstracer.error('can not get <%s> error <%s>', worker.url, err);
            worker.parent.queue(worker.url, {
                priority: grabwork.MIN_PRIORITY,
                reportmain: worker.reqopt.reportmain
            });
            return;
        }

        parser = cheerio.load(worker.htmldata, {
            xmlMode: true,
            ignoreWhitespace: true
        });

        content = parser("#PageCont");
        for (idx = 0; idx < content.length; idx += 1) {
            curelm = content.eq(idx);
            jstracer.info('[%d] text [%s]', idx, curelm.text());
        }
        return;
    };
    return mainobj;
}

module.exports = createMain;