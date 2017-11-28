var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var cheerio = require('cheerio');
//var URL = require('url');
var grab = grabwork();


var szse_main_get_number_span = function (htmldata) {
    'use strict';
    var parser;
    var content;
    var idx;
    var needidx = -1;
    var num = -1;
    parser = cheerio.load(htmldata);
    content = parser('tr').find('span');
    for (idx = 0; idx < content.length; idx += 1) {
        if (content.eq(idx).attr('class') === undefined) {
            if (needidx < 0) {
                needidx = idx;
            } else {
                num = parseInt(content.eq(idx).text(), 10);
                break;
            }
        }
    }
    return num;
};


function createSzseMain(options) {
    'use strict';
    var szse = null;

    szse = {};

    jstracer.trace('init create ');
    szse.post_handler = function (err, worker, next) {
        var reqopt;
        var szsegrab = {};
        var numspan = -1;
        var idx;

        jstracer.info('reqopt [%s]', util.inspect(worker.reqopt, {
            showHidden: true,
            depth: null
        }));
        if (!baseop.is_non_null(worker.reqopt, 'szsemain')) {
            next(true, err);
            return;
        }

        if (err !== undefined && err !== null) {
            if (worker.reqopt.szsemain.szsetries < worker.reqopt.szsemain.szse_max_tries) {
                jstracer.warn('[%d] can not get [%s]', worker.reqopt.szsemain.szsetries, worker.reqopt.szsemain.queryurl);
                worker.reqopt.szsemain.szsetries += 1;
                grab.post_queue(worker.reqopt.szsemain.queryurl, worker.reqopt);
                return;
            }

            /*now it is totally failed*/
            jstracer.error('[%d] totally failed [%s]', worker.reqopt.szsemain.szsetries, worker.reqopt.szsemain.queryurl);
            return;
        }

        numspan = szse_main_get_number_span(worker.htmldata);
        if (numspan < 0) {
            if (worker.reqopt.szsemain.szsetries < worker.reqopt.szsemain.szse_max_tries) {
                jstracer.warn('[%d] not get right span number', worker.reqopt.szsemain.szsetries);
                worker.reqopt.szsemain.szsetries += 1;
                grab.post_queue(worker.reqopt.szsemain.queryurl, worker.reqopt);
                return;
            }
            jstracer.error('[%d] totally failed [%s]', worker.reqopt.szsemain.szsetries, worker.reqopt.szsemain.queryurl);
            return;
        }

        /*now it is we search ,so we should */
        for (idx = 0; idx < numspan; idx += 1) {
            reqopt = {};
            szsegrab = {};
            szsegrab.headers = {
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
            szsegrab.szse_max_tries = 5;
            if (options !== undefined && options !== null && baseop.is_non_null(options, 'maxtries')) {
                szsegrab.szse_max_tries = options.maxtries;
            }
            szsegrab.szsetries = 0;
            szsegrab.queryurl = 'http://disclosure.szse.cn/m/search0425.jsp';
            szsegrab.postdata = util.format('leftid=1&lmid=drgg&pageNo=%d&stockCode=%s&keyword=&noticeType=&startTime=%s&endTime=%s&imageField.x=45&imageField.y=7&tzy=', (idx + 1), reqopt.szsemain.stockcode, reqopt.szsemain.startdate, reqopt.szsemain.enddate);
            reqopt.body = szsegrab.postdata;
            reqopt.headers = szsegrab.headers;
            reqopt.szsegrab = szsegrab;
            grab.post_queue(szsegrab.queryurl, reqopt);
        }
        return;
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

    szsemain.postdata = util.format('leftid=1&lmid=drgg&stockCode=%s&keyword=&noticeType=&startTime=%s&endTime=%s&imageField.x=45&imageField.y=7', stockcode, szsemain.startdate, szsemain.enddate);
    reqopt.body = szsemain.postdata;
    reqopt.headers = szsemain.headers;
    szsemain.szsetries = 0;
    szsemain.szse_max_tries = 5;
    if (baseop.is_valid_number(options, 'maxtries')) {
        szsemain.szse_max_tries = options.maxtries;
    }
    reqopt.szsemain = szsemain;
    jstracer.warn('reqopt22 [%s]', util.inspect(reqopt, {
        showHidden: true,
        depth: null
    }));

    grab.post_queue(szsemain.queryurl, reqopt);
    return;
}

module.exports = createSzseMain;
module.exports.AddSzseMain = AddSzseMain;