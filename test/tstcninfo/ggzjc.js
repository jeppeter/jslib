var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var grab = grabwork();
var path = require('path');
var CryptoJS = require('crypto-js');
var fs = require('fs');


function createGaoguanzengjianchi(options) {
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
            var dv = JSON.parse(worker.htmldata);
            var returls = cninfo.parse_urls(dv);
            returls.forEach(function (cv) {
                cninfo.download_next(cv, worker.reqopt.cninfomain.stockcode);
            });


        } catch (e) {
            jstracer.error('e %s', e);
            cninfo.post_next_error(e, worker, next);
            return;
        }


        /*ok ,we should have this*/
        next(false, null);
        return;
    };


    cninfo.format_url = function (stockcode) {
        return util.format('http://webapi.cninfo.com.cn/api/info/p_info3085?scode=%s', stockcode);
    };

    cninfo.get_cninfo_scode = function () {
        var dtime = (new Date().getTime() / 1000);
        var stime = CryptoJS.enc.Utf8.parse(Math.floor(dtime));
        var keystr = CryptoJS.enc.Utf8.parse('1234567887654321');
        var encdata = CryptoJS.AES.encrypt(stime, keystr, {iv: keystr, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
        return CryptoJS.enc.Base64.stringify(encdata.ciphertext);
    };

    cninfo.get_headers = function () {
        var headers = {};
        headers.Accept = '*/*';
        headers['Accept-EncKey'] = cninfo.get_cninfo_scode();
        jstracer.trace('Accept-EncKey %s', headers['Accept-EncKey']);
        //headers['Accept-Encoding'] = 'gzip, deflate';
        headers['Accept-Language'] = 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7';
        headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
        headers.Host = 'webapi.cninfo.com.cn';
        headers.Origin = 'http://webapi.cninfo.com.cn';
        headers.Referer = 'http://webapi.cninfo.com.cn/';
        headers['X-Requested-With'] = 'XMLHttpRequest';
        return headers;
    };

    cninfo.post_queue_url = function (stockcode) {
        var url;
        var headers = {};
        if (baseop.is_valid_string(cninfo.options, 'listinput', 1)) {
            fs.readFile(cninfo.options.listinput, function (err2, data2) {
                if (err2 !== null && err2 !== undefined) {
                    jstracer.error('can not read [%s] error %s', cninfo.options.listinput, err2);
                    process.exit(5);
                }
                var cc = util.format('%s', data2);
                var returls = cc.split('\n');
                returls.forEach(function (cv) {
                    if (cv.length > 0 && !cv.startsWith('#')) {
                        var carr = cv.split('|');
                        if (carr.length >= 2) {
                            cninfo.download_next(carr[1], carr[0]);
                        }
                    }
                });
            });
        } else {
            url = cninfo.format_url(stockcode);
            headers = cninfo.get_headers();
            grab.queue(url, {
                reqopt: {
                    timeout: cninfo.options.timeout,
                    headers: headers
                },
                cninfomain: {
                    stockcode: stockcode,
                    enddate: cninfo.options.enddate,
                    startdate: cninfo.options.startdate,
                    trycnt: 0,
                    maxcnt: cninfo.options.maxcnt
                }
            });
        }

    };

    return cninfo;
}

module.exports = createCninfoNewMain;