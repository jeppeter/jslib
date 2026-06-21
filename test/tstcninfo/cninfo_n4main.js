var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var grab = grabwork();
var path = require('path');
var CryptoJS = require('crypto-js');
var fs = require('fs');



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
    cninfo.options.listoutput = null;
    cninfo.options.listouthd = null;
    cninfo.options.listinput = null;

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

    if (baseop.is_valid_string(options, 'listoutput', 1)) {
        cninfo.options.listoutput = options.listoutput;
    }

    if (baseop.is_valid_string(options, 'listinput', 1)) {
        cninfo.options.listinput = options.listinput;
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

    cninfo.hyfein_date_to_value = function (hdate) {
        var retval = 0;
        var sarr = hdate.split('-');
        if (sarr.length >= 3) {
            retval += parseInt(sarr[0], 10) * 10000;
            retval += parseInt(sarr[1], 10) * 100;
            retval += parseInt(sarr[2], 10);
        }
        return retval;
    };

    cninfo.download_next = function (cv, stockcode) {
        /*to get the date*/
        var downloadurl;
        var downloadreqopt = {};
        var yearnum = '2020';
        var fname;
        var sarr;
        downloadurl = cv;
        sarr = downloadurl.split('/');
        if (sarr.length >= 2) {
            var carr = sarr[sarr.length - 2].split('-');
            if (carr.length > 0) {
                if (carr[0].length <= 4) {
                    yearnum = carr[0];    
                } else {
                    yearnum = carr[0].substring(0,4);
                }
                jstracer.info('yearnum %s', yearnum);
                
            }
        }

        fname = path.join(cninfo.options.baselocate, stockcode, yearnum, sarr[sarr.length - 1]);
        if (baseop.is_valid_string(cninfo.options, 'listoutput', 1)) {
            if (!baseop.is_non_null(cninfo.options, 'listouthd')) {
                cninfo.options.listouthd = fs.createWriteStream(cninfo.options.listoutput);
                cninfo.options.listouthd.write(util.format('# format the year|url format\n'));
            }
            cninfo.options.listouthd.write(util.format('%s|%s\n', stockcode, downloadurl));
        } else {
            downloadreqopt.downloadoption = {};
            downloadreqopt.downloadoption.downloadfile = fname;
            grab.download_queue(downloadurl, downloadreqopt);
        }
    };

    cninfo.parse_urls = function (dv) {
        var returls = [];
        var svalue = cninfo.hyfein_date_to_value(cninfo.options.startdate);
        var evalue = cninfo.hyfein_date_to_value(cninfo.options.enddate);
        if (baseop.is_non_null(dv, 'records')) {
            dv.records.forEach(function (cv) {
                if (baseop.is_non_null(cv,'RECTIME') && baseop.is_non_null(cv,'F003V')) {
                    var ccarr = cv.RECTIME.split(' ');
                    if (ccarr.length >= 2) {
                        jstracer.info('ccarr[%d] = [%s]', 0, ccarr[0]);
                        var cval = cninfo.hyfein_date_to_value(ccarr[0]);
                        if (cval >= svalue && cval <= evalue) {
                            returls.push(cv.F003V);
                        }
                    }

                } else if (baseop.is_non_null(cv, 'F003V')) {
                    var ccarr = cv.F003V.split('/');
                    if (ccarr.length >= 2) {
                        jstracer.info('ccarr[%d] = [%s]', ccarr.length - 2, ccarr[ccarr.length - 2]);
                        var cval = cninfo.hyfein_date_to_value(ccarr[ccarr.length - 2]);
                        if (cval >= svalue && cval <= evalue) {
                            returls.push(cv.F003V);
                        }
                    }
                } else {
                    jstracer.info('no F003V');
                }
            });
        } else {
            jstracer.info('no records');
        }
        return returls;
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