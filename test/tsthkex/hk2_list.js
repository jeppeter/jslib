var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var path = require('path');
var grab = grabwork();

var parse_json = function (data) {
    'use strict';
    try {
        var rdict = JSON.parse(data);
        if (rdict.result !== undefined) {
            rdict.result = JSON.parse(rdict.result);
        }
        var outs = JSON.stringify(rdict, null, 4);
        jstracer.info('outs\n%s', outs);
        return JSON.parse(outs);
    } catch (e) {
        jstracer.error('cannot parse\n%s', e);
        return undefined;
    }
};

var get_year_value = function (s) {
    'use strict';
    var sarr;
    var carr;
    sarr = s.split(' ');
    carr = sarr[0].split('/');
    if (carr.length >= 2) {
        return carr[2];
    }
    return undefined;

};


function createHk2List(options) {
    'use strict';
    var hk2list;
    var d;
    hk2list = {};
    hk2list = {};
    hk2list.options = {};
    hk2list.options.maxcnt = 5;
    hk2list.options.startdate = '20000101';
    hk2list.options.baselocate = '.';
    d = new Date();
    hk2list.options.enddate = '';
    hk2list.options.enddate += baseop.number_format_length(4, d.getFullYear());
    hk2list.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    hk2list.options.enddate += baseop.number_format_length(2, d.getDate());


    if (baseop.is_valid_date_ex(options.startdate)) {
        hk2list.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date_ex(options.enddate)) {
        hk2list.options.enddate = options.enddate;
    }

    if (baseop.is_valid_string(options, 'topdir', 1)) {
        hk2list.options.baselocate = options.topdir;
    }

    if (baseop.is_valid_number(options.timeout, false)) {
        hk2list.options.timeout = options.timeout;
    }

    if (baseop.is_valid_number(options.maxcnt, false)) {
        hk2list.options.maxcnt = options.maxcnt;
    }


    hk2list.format_url = function (stockid, rowrange) {
        return util.format('https://www1.hkexnews.hk/search/titleSearchServlet.do?sortDir=0&sortByOptions=DateTime&category=0&market=SEHK&stockId=%s&documentType=-1&fromDate=%s&toDate=%s&title=&searchType=0&t1code=-2&t2Gcode=-2&t2code=-2&rowRange=%s&lang=zh', stockid, hk2list.options.startdate, hk2list.options.enddate, rowrange);
    };

    hk2list.post_next_error = function (err, worker, next) {
        jstracer.error('<GET::%s> error %s', worker.url, err);
        worker.reqopt.hk2listopt.trycnt += 1;
        if (worker.reqopt.hk2listopt.trycnt < worker.reqopt.hk2listopt.maxcnt) {
            var url;
            url = hk2list.format_url(worker.reqopt.hk2listopt.stockcode);
            //headers = hk2stockid.get_headers();
            worker.parent.queue(url, {
                reqopt: {
                    timeout: hk2list.options.timeout,
                    hk2listopt: worker.reqopt.hk2listopt
                },
                priority: grabwork.MIN_PRIORITY,
                hk2listopt: worker.reqopt.hk2listopt
            });
        }
        next(false, err);
        return;
    };

    hk2list.post_handler = function (err, worker, next) {
        if (!baseop.is_non_null(worker.reqopt.hk2listopt)) {
            next(true, err);
            return;
        }

        if (err) {
            /*we should query again*/
            hk2list.post_next_error(err, worker, next);
            return;
        }
        /*to parse data*/
        try {
            //jstracer.info('body %s', worker.htmldata);
            var rdict = parse_json(worker.htmldata);
            if (rdict === undefined) {
                throw new Error(util.format('not parse\n%s', worker.htmldata));
            }
            //hk2list.start_url(retval);
            jstracer.info('recordCnt %d rowrange %d', rdict.recordCnt, rdict.rowRange);
            if (rdict.recordCnt > rdict.rowRange) {
                var url = hk2list.format_url(worker.reqopt.hk2listopt.stockid, rdict.recordCnt + 1);
                var hk2listopt = {};
                hk2listopt.trycnt = 0;
                hk2listopt.maxcnt = hk2list.options.maxcnt;
                hk2listopt.realstockid = worker.reqopt.hk2listopt.realstockid;
                hk2listopt.stockid = worker.reqopt.hk2listopt.stockid;
                grab.queue(url, {
                    reqopt: {
                        hk2listopt: hk2listopt
                    },
                    hk2listopt: hk2listopt
                });
            } else {
                rdict.result.forEach(function (elm) {
                    var cururl;
                    var curpath;
                    cururl = util.format('https://www1.hkexnews.hk');
                    if (baseop.is_valid_string(elm, 'FILE_LINK', 1)) {
                        cururl += elm.FILE_LINK;
                        curpath = hk2list.options.baselocate;
                        curpath += path.sep;
                        curpath += worker.reqopt.hk2listopt.realstockid;
                        curpath += path.sep;
                        if (baseop.is_valid_string(elm, 'DATE_TIME', 1)) {
                            var y = get_year_value(elm.DATE_TIME);
                            if (y !== undefined) {
                                curpath += y;
                                //curpath += path.sep;
                                //curpath += path.basename(elm.FILE_LINK);
                                worker.parent.download_queue(cururl, curpath, {
                                    priority: grabwork.MAX_PRIORITY
                                });
                            }
                        } else {
                            jstracer.error('DATE_TIME not valid');
                        }
                    } else {
                        jstracer.error('FILE_LINK not has\n%s', util.inspect(elm));
                    }
                });
            }
        } catch (e) {
            jstracer.error('e %s', e);
            hk2list.post_next_error(e, worker, next);
            return;
        }


        /*ok ,we should have this*/
        next(false, null);
        return;
    };

    hk2list.start_fetch = function (stockid, realstockid) {
        var hk2listopt = {};
        var url = hk2list.format_url(stockid, 100);
        hk2listopt.trycnt = 0;
        hk2listopt.maxcnt = hk2list.options.maxcnt;
        hk2listopt.realstockid = realstockid;
        hk2listopt.stockid = stockid;
        grab.queue(url, {
            reqopt: {
                hk2listopt: hk2listopt
            },
            hk2listopt: hk2listopt
        });
        return;
    };

    return hk2list;
}


module.exports = createHk2List;