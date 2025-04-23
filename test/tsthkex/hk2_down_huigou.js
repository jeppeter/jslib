var jstracer = require('jstracer');
var baseop = require('../../baseop');
var grabwork = require('../../grabwork');
var util = require('util');
var grab = grabwork();
var cheerio = require('cheerio');

var call_cheerparser_data = function (data, selector, callback) {
    'use strict';
    var parser;
    var content;
    parser = cheerio.load(data, {
        xmlMode: true,
        ignoreWhitespace: true
    });
    content = parser(selector);
    callback(parser, content);
    return;

};



function createHk2DownHuiGou(options) {
    'use strict';
    var hk2downhuigou;
    var d;
    hk2downhuigou = {};
    hk2downhuigou = {};
    hk2downhuigou.options = {};
    hk2downhuigou.options.maxcnt = 5;
    hk2downhuigou.options.startdate = '20000101';
    d = new Date();
    hk2downhuigou.options.enddate = '';
    hk2downhuigou.options.enddate += baseop.number_format_length(4, d.getFullYear());
    hk2downhuigou.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    hk2downhuigou.options.enddate += baseop.number_format_length(2, d.getDate());
    hk2downhuigou.options.baselocate = '.';


    if (baseop.is_valid_date_ex(options.startdate)) {
        hk2downhuigou.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date_ex(options.enddate)) {
        hk2downhuigou.options.enddate = options.enddate;
    }

    if (baseop.is_valid_string(options, 'topdir', 1)) {
        hk2downhuigou.options.baselocate = options.topdir;
    }

    if (baseop.is_valid_number(options.timeout, false)) {
        hk2downhuigou.options.timeout = options.timeout;
    }

    if (baseop.is_valid_number(options.maxcnt, false)) {
        hk2downhuigou.options.maxcnt = options.maxcnt;
    }


    hk2downhuigou.format_url = function () {
        return util.format('https://sc.hkexnews.hk/TuniS/www3.hkexnews.hk/reports/sharerepur/sbn_c.asp');
    };
    hk2downhuigou.format_data = function (yval, mval) {
        return util.format('y=%d&m=%d', yval, mval);
    };

    hk2downhuigou.post_next_error = function (err, worker, next) {
        jstracer.error('<GET::%s> error %s', worker.url, err);
        worker.reqopt.hk2downhuigouopt.trycnt += 1;
        if (worker.reqopt.hk2downhuigouopt.trycnt < worker.reqopt.hk2downhuigouopt.maxcnt) {
            var url;
            var postdata;
            url = hk2downhuigou.format_url();
            postdata = hk2downhuigou.format_data(worker.reqopt.hk2downhuigouopt.year, worker.reqopt.hk2downhuigouopt.month);
            //headers = hk2downhuigou.get_headers();
            worker.parent.post_queue(url, {
                reqopt: {
                    timeout: hk2downhuigou.options.timeout,
                    hk2downhuigouopt: worker.reqopt.hk2downhuigouopt,
                    body: postdata
                },
                priority: grabwork.MIN_PRIORITY,
                hk2downhuigouopt: worker.reqopt.hk2downhuigouopt
            });
        }
        next(false, err);
        return;
    };



    hk2downhuigou.post_handler = function (err, worker, next) {
        if (!baseop.is_non_null(worker.reqopt.hk2downhuigouopt)) {
            next(true, err);
            return;
        }

        if (err) {
            /*we should query again*/
            hk2downhuigou.post_next_error(err, worker, next);
            return;
        }
        /*to parse data*/
        jstracer.info('htmldata\n%s', worker.htmldata);
        call_cheerparser_data(worker.htmldata, "div[class='day-grid'] a", function (parser, content) {
            content.each(function () {
                var val = parser(this).attr('href');
                jstracer.info('href [%s]', val);
            });
            next(false, err);
        });


        /*ok ,we should have this*/
        return;
    };

    hk2downhuigou.start_code = function (ymval) {
        var hk2downhuigouopt = {};
        var postdata = hk2downhuigou.format_data(ymval[0], ymval[1]);
        var url = hk2downhuigou.format_url();
        hk2downhuigouopt.trycnt = 0;
        hk2downhuigouopt.maxcnt = hk2downhuigou.options.maxcnt;
        hk2downhuigouopt.year = ymval[0];
        hk2downhuigouopt.month = ymval[1];
        jstracer.info('year %d month %d postdata %s', ymval[0], ymval[1], postdata);
        grab.post_queue(url, {
            reqopt: {
                body: postdata,
                hk2downhuigouopt: hk2downhuigouopt
            },
            hk2downhuigouopt: hk2downhuigouopt
        });
    };




    return hk2downhuigou;
}

module.exports = createHk2DownHuiGou;