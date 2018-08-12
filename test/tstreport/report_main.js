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
    mainobj.options.startdate = options.startdate;
    mainobj.options.enddate = options.enddate;
    mainobj.post_handler = function (err, worker, next) {
        var parser;
        var content;
        var idx;
        var jdx;
        var curchld;
        //var maxnum = 0;
        var curelm;
        var children;
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
            jstracer.info('[%d] text [%s]', idx, util.inspect(curelm, {
                showHidden: true,
                depth: 3
            }));
            children = curelm.children();
            jstracer.info('children %d', children.length);
            for (jdx = 0; jdx < children.length; jdx += 1) {
                curchld = children.eq(jdx);
                jstracer.info('[%d].[%d] text [%s]', idx, jdx, curchld.text());
            }
        }
        next(false, null);
        return;
    };
    return mainobj;
}

module.exports = createMain;