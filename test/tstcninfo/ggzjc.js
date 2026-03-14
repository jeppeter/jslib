var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var grab = grabwork();
var path = require('path');
var CryptoJS = require('crypto-js');
var fs = require('fs');


function createGgzjc(options) {
    'use strict';
    var ggzjc;
    var d;
    ggzjc = {};

    ggzjc.options = {};
    ggzjc.options.startdate = '2000-01-01';
    d = new Date();
    ggzjc.options.enddate = '';
    ggzjc.options.enddate += baseop.number_format_length(4, d.getFullYear());
    ggzjc.options.enddate += '-';
    ggzjc.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    ggzjc.options.enddate += '-';
    ggzjc.options.enddate += baseop.number_format_length(2, d.getDate());
    ggzjc.options.maxcnt = 5;
    ggzjc.options.pagesize = 50;
    ggzjc.options.baselocate = '.';
    ggzjc.options.timeout = 5000;
    ggzjc.options.listoutput = null;
    ggzjc.options.listouthd = null;
    ggzjc.options.listinput = null;
    ggzjc.options.setindex = 0;
    ggzjc.options.getindex = 0;

    if (baseop.is_valid_date_ex(options.startdate)) {
        ggzjc.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date_ex(options.enddate)) {
        ggzjc.options.enddate = options.enddate;
    }

    if (baseop.is_valid_string(options, 'topdir', 1)) {
        ggzjc.options.baselocate = options.topdir;
    }

    if (baseop.is_valid_number(options.timeout, false)) {
        ggzjc.options.timeout = options.timeout;
    }

    if (baseop.is_valid_string(options, 'listoutput', 1)) {
        ggzjc.options.listoutput = options.listoutput;
    }

    if (baseop.is_valid_string(options, 'listinput', 1)) {
        ggzjc.options.listinput = options.listinput;
    }



    ggzjc.post_next_error = function (err, worker, next) {
        jstracer.error('<GET::%s> error %s', worker.url, err);
        worker.reqopt.ggzjc.trycnt += 1;
        if (worker.reqopt.ggzjc.trycnt < worker.reqopt.ggzjc.maxcnt) {
            var url;
            url = worker.url;
            worker.parent.queue(url, {
                reqopt: {
                    timeout: ggzjc.options.timeout
                },
                priority: grabwork.MIN_PRIORITY,
                ggzjc: worker.reqopt.ggzjc
            });
        }
        next(false, err);
        return;
    };


    ggzjc.filter_data =  function(data) {
        var retdata;
        const regdata = /[a-zA-Z_]+\(/i;
        retdata = data.replace(/^[a-zA-Z_]+\(/,"");
        retdata = retdata.replace(/[\);]+$/,"");
        return retdata;
    }

    ggzjc.post_handler = function (err, worker, next) {

        if (!baseop.is_non_null(worker.reqopt.ggzjc)) {
            next(true, err);
            return;
        }

        if (err) {
            /*we should query again*/
            ggzjc.post_next_error(err, worker, next);
            return;
        }
        /*to parse data*/
        try {

            var jsondata = ggzjc.filter_data(worker.htmldata);
            jstracer.info('htmldata\n%s\njsondata\n%s', worker.htmldata,jsondata);
            var rdict = JSON.parse(jsondata);
            console.log('rdict\n%s',rdict);

        } catch (e) {
            jstracer.error('e %s', e);
            ggzjc.post_next_error(e, worker, next);
            return;
        }


        /*ok ,we should have this*/
        next(false, null);
        return;
    };



    ggzjc.post_url = function(index) {
        if (ggzjc.options.setindex < index) {
            var url = util.format('https://datacenter-web.eastmoney.com/api/data/v1/get?callback=parse_data&reportName=RPT_EXECUTIVE_HOLD_DETAILS&columns=ALL&quoteColumns=&filter=&pageNumber=%d&pageSize=50&sortTypes=-1,1,1&sortColumns=CHANGE_DATE,SECURITY_CODE,PERSON_NAME&source=WEB&client=WEB&p=32&pageNo=32&pageNum=32&_=1773474776305',index);
            jstracer.info('url\n%s', url);
            var reqopt = {};
            reqopt.ggzjc = {};
            reqopt.ggzjc.trycnt = 0;
            reqopt.ggzjc.maxcnt = ggzjc.options.maxcnt;
            reqopt.ggzjc.index = index;
            grab.queue(url,reqopt);
            ggzjc.options.setindex = index;
        }
        return;
    };



    return ggzjc;
}

module.exports = createGgzjc;