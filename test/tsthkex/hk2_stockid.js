var jstracer = require('jstracer');
var baseop = require('../../baseop');
var grabwork = require('../../grabwork');
var util = require('util');
var hk2list = require('./hk2_list');
var grab = grabwork();

var callback = function (args) {
    'use strict';
    var retval = undefined;
    if (args.stockInfo !== undefined) {
        var cval = args.stockInfo;
        if (cval.length >= 1) {
            if (cval[0].stockId !== undefined) {
                retval = cval[0].stockId;
            }
        }
    }
    return retval;
};



function createHk2StockId(options) {
    'use strict';
    var hk2stockid;
    var d;
    hk2stockid = {};
    hk2stockid = {};
    hk2stockid.options = {};
    hk2stockid.options.maxcnt = 5;
    hk2stockid.options.startdate = '20000101';
    d = new Date();
    hk2stockid.options.enddate = '';
    hk2stockid.options.enddate += baseop.number_format_length(4, d.getFullYear());
    hk2stockid.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    hk2stockid.options.enddate += baseop.number_format_length(2, d.getDate());
    hk2stockid.list = hk2list(options);


    if (baseop.is_valid_date_ex(options.startdate)) {
        hk2stockid.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date_ex(options.enddate)) {
        hk2stockid.options.enddate = options.enddate;
    }

    if (baseop.is_valid_string(options, 'topdir', 1)) {
        hk2stockid.options.baselocate = options.topdir;
    }

    if (baseop.is_valid_number(options.timeout, false)) {
        hk2stockid.options.timeout = options.timeout;
    }

    if (baseop.is_valid_number(options.maxcnt, false)) {
        hk2stockid.options.maxcnt = options.maxcnt;
    }


    hk2stockid.format_url = function (stockcode) {
        return util.format('https://www1.hkexnews.hk/search/prefix.do?=&callback=callback&lang=EN&type=A&name=%s&market=SEHK', stockcode);
    };

    hk2stockid.post_next_error = function (err, worker, next) {
        jstracer.error('<GET::%s> error %s', worker.url, err);
        worker.reqopt.hk2stockidopt.trycnt += 1;
        if (worker.reqopt.hk2stockidopt.trycnt < worker.reqopt.hk2stockidopt.maxcnt) {
            var url;
            url = hk2stockid.format_url(worker.reqopt.hk2stockidopt.stockcode);
            //headers = hk2stockid.get_headers();
            worker.parent.queue(url, {
                reqopt: {
                    timeout: hk2stockid.options.timeout,
                    hk2stockidopt: worker.reqopt.hk2stockidopt
                },
                priority: grabwork.MIN_PRIORITY,
                hk2stockidopt: worker.reqopt.hk2stockidopt
            });
        }
        next(false, err);
        return;
    };



    hk2stockid.post_handler = function (err, worker, next) {
        if (!baseop.is_non_null(worker.reqopt.hk2stockidopt)) {
            next(true, err);
            return;
        }

        if (err) {
            /*we should query again*/
            hk2stockid.post_next_error(err, worker, next);
            return;
        }
        /*to parse data*/
        try {
            jstracer.info('body %s', worker.htmldata);
            var retval = eval(worker.htmldata);
            if (retval === undefined) {
                throw new Error(util.format('not parse\n%s', worker.htmldata));
            }
            //hk2list.start_url(retval);
            jstracer.info('get retval %s', retval);
            hk2stockid.list.start_fetch(retval, worker.reqopt.hk2stockidopt.stockcode);
        } catch (e) {
            jstracer.error('e %s', e);
            hk2stockid.post_next_error(e, worker, next);
            return;
        }


        /*ok ,we should have this*/
        next(false, null);
        return;
    };

    hk2stockid.start_code = function (stockcode) {
        var url = hk2stockid.format_url(stockcode);
        var hk2stockidopt = {};
        hk2stockidopt.trycnt = 0;
        hk2stockidopt.maxcnt = hk2stockid.options.maxcnt;
        hk2stockidopt.stockcode = stockcode;
        grab.queue(url, {
            reqopt: {
                hk2stockidopt: hk2stockidopt
            },
            hk2stockidopt: hk2stockidopt
        });
    };




    return hk2stockid;
}

module.exports = createHk2StockId;