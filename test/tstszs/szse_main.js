var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var cheerio = require('cheerio');
var URL = require('url');



function createSzseMain(options, stockcode) {
    'use strict';
    var szse = null;

    szse = {};

    szse.post_handler = function(err, worker, next) {
        var queryurl;
        var postdata;

        if (!baseop.is_valid_string(worker.reqopt, 'szsemain')) {
            next(true, err);
            return;
        }

        if (err !== undefined && err !== null) {
            if (worker.reqopt.szsetries < worker.reqopt.szse_max_tries) {
                jstracer.warn
            }
        }

        /*now it is we search ,so we should */
    };

    return szse;
}

function AddSzseMain(options, stockcode) {
    'use strict';
    var reqopt = {};
    var d;
    var szsemain = {};

    szsemain.stockcode = '000001';
    szsemain.startdate = '1999-01-01';
    szsemain.queryurl = 'http://disclosure.szse.cn/m/search0425.jsp';

    d = new Date();
    szsemain.enddate = '';
    szsemain.enddate += baseop.number_format_length(4, d.getFullYear());
    szsemain.enddate += '-';
    szsemain.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    szsemain.enddate += '-';
    szsemain.enddate += baseop.number_format_length(2, d.getDate());

    if (stockcode !== undefined && stockcode !== null) {
        szsemain.stockcode = stockcode;
    }

    if (baseop.is_valid_string(options, 'querypath')) {
        szsemain.queryurl = options.querypath;
    }

    if (baseop.is_valid_string(options, 'startdate') && options.startdate.length === 8) {
        szsemain.startdate = '';
        szsemain.startdate += options.startdate.substring(0, 4);
        szsemain.startdate += '-';
        szsemain.startdate += options.startdate.substring(4, 6);
        szsemain.startdate += '-';
        szsemain.startdate += options.startdate.substring(6, 8);
    }

    if (baseop.is_valid_string(options, 'enddate') && options.enddate.length === 8) {
        szsemain.enddate = '';
        szsemain.enddate += options.enddate.substring(0, 4);
        szsemain.enddate += '-';
        szsemain.enddate += options.enddate.substring(4, 6);
        szsemain.enddate += '-';
        szsemain.enddate += options.enddate.substring(6, 8);
    }

    szsemain.headers = {
        Host: 'disclosure.szse.cn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        Referer: 'http://disclosure.szse.cn/m/search0425.jsp',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': 1,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    szsemain.postdata = util.format('leftid=1&lmid=drgg&pageNo=1&stockCode=%s&keyword=&noticeType=&startTime=%s&endTime=%s&imageField.x=45&imageField.y=7&tzy=', reqopt.stockcode, reqopt.startdate, reqopt.enddate);
    reqopt.body = reqopt.postdata;
    reqopt.headers = szsemain.headers;
    szsemain.szsetries = 0;
    szsemain.szse_max_tries = 5;
    if (baseop.is_valid_number(options, 'maxtries')) {
        szsemain.szse_max_tries = options.maxtries;
    }
    reqopt.szsemain = szsemain;

    grabwork.post_queue(reqopt.queryurl, reqopt);
    return;
}

module.exports = createSzseMain;
module.exports.AddSzseMain = AddSzseMain;