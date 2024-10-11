var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var grab = grabwork();
var path = require('path');
var CryptoJS = require('crypto-js');



function createCninfoNewMain(options) {
    'use strict';
    var cninfo;
    var d;
    cninfo = {};

    cninfo.options = {};
    cninfo.options.startdate = '2000-01-01';
    d = new Date();
    cninfo.options.enddate = '';
    cninfo.options.enddate += baseop.number_format_length(4, d.getFullYear());
    cninfo.options.enddate += '-';
    cninfo.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    cninfo.options.enddate += '-';
    cninfo.options.enddate += baseop.number_format_length(2, d.getDate());
    cninfo.options.maxcnt = 5;
    cninfo.options.pagesize = 30;
    cninfo.options.baselocate = '.';
    cninfo.options.timeout = 5000;

    if (baseop.is_valid_date_ex(options.startdate)) {
        cninfo.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date_ex(options.enddate)) {
        cninfo.options.enddate = options.enddate;
    }

    if (baseop.is_valid_string(options, 'topdir', 1)) {
        cninfo.options.baselocate = options.topdir;
    }

    if (baseop.is_valid_number(options.timeout, false)) {
        cninfo.options.timeout = options.timeout;
    }



    cninfo.post_next_error = function (err, worker, next) {
        jstracer.error('<GET::%s> error %s', worker.url, err);
        worker.reqopt.cninfomain.trycnt += 1;
        if (worker.reqopt.cninfomain.trycnt < worker.reqopt.cninfomain.maxcnt) {
            var url;
            var headers = {};
            url = cninfo.format_url(worker.reqopt.cninfo.stockcode);
            headers = cninfo.get_headers();
            worker.parent.queue(url, {
                reqopt: {
                    timeout: cninfo.options.timeout,
                    headers: headers
                },
                priority: grabwork.MIN_PRIORITY,
                cninfomain: worker.reqopt.cninfomain
            });
        }
        next(false, err);
        return;
    };

    cninfo.post_handler = function (err, worker, next) {


        if (!baseop.is_non_null(worker.reqopt.cninfomain)) {
            next(true, err);
            return;
        }

        if (err) {
            /*we should query again*/
            cninfo.post_next_error(err, worker, next);
            return;
        }
        /*to parse data*/
        try {
            var dv = JSON.parse(worker.htmldata);
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
    };

    return cninfo;
}

module.exports = createCninfoNewMain;