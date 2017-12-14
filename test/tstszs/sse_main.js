var util = require('util');
var grabwork = require('../../grabwork');
var baseop = require('../../baseop');
var grab = grabwork();
var jstracer = require('jstracer');
var path = require('path');

function createSSEMainRequest(opt, stockcode, idx) {
    'use strict';
    var ssemain = {};
    var reqopt = {};
    var rnd1;
    var time1;
    var callbackstr;
    var d;
    var endpage;


    rnd1 = Math.floor(Math.random() * 100000);
    callbackstr = util.format('jsonpCallback%s', rnd1);
    d = new Date();
    time1 = Math.floor(d.getTime() / 1000);
    if (idx <= 1) {
        endpage = 5;
    } else {
        endpage = (idx * 10) + 1;
    }

    ssemain.queryurl = util.format('http://query.sse.com.cn/security/stock/queryCompanyStatementNew.do?jsonCallBack=%s&isPagination=true&productId=%s&keyWord=&isNew=1&reportType2=&reportType=ALL&beginDate=%s&endDate=%s&pageHelp.pageSize=25&pageHelp.pageCount=50&pageHelp.pageNo=%s&pageHelp.beginPage=%s&pageHelp.cacheSize=1&pageHelp.endPage=%s&_=%s', callbackstr, stockcode, opt.startdate, opt.enddate, idx, idx, endpage, time1);
    //jstracer.trace('query url [%s]', ssemain.queryurl);
    ssemain.headers = {
        Referer: "http://www.sse.com.cn/disclosure/listedinfo/announcement/"
    };
    ssemain.ssetries = 0;
    ssemain.maxtries = opt.maxtries;
    ssemain.stockcode = stockcode;
    ssemain.startdate = opt.startdate;
    ssemain.enddate = opt.enddate;
    ssemain.idx = idx;
    ssemain.topdir = opt.topdir;
    ssemain.callbackstr = callbackstr;
    reqopt.ssemain = ssemain;
    reqopt.reqopt = {};
    reqopt.reqopt.headers = ssemain.headers;
    return reqopt;
}


var succCreateSSEMainRequest = function (worker) {
    'use strict';
    var realopt = {};
    var newreqopt = {};
    realopt.startdate = worker.reqopt.ssemain.startdate;
    realopt.enddate = worker.reqopt.ssemain.enddate;
    realopt.maxtries = worker.reqopt.ssemain.maxtries;
    realopt.topdir = worker.reqopt.ssemain.topdir;
    newreqopt = createSSEMainRequest(realopt, worker.reqopt.ssemain.stockcode, (worker.reqopt.ssemain.idx + 1));
    grab.queue(newreqopt.ssemain.queryurl, newreqopt);
    return;
};


var errorCreateSSEMainRequest = function (worker) {
    'use strict';
    var realopt = {};
    var newreqopt = null;
    if (worker.reqopt.ssemain.ssetries < worker.reqopt.ssemain.maxtries) {
        realopt.startdate = worker.reqopt.ssemain.startdate;
        realopt.enddate = worker.reqopt.ssemain.enddate;
        realopt.maxtries = worker.reqopt.ssemain.maxtries;
        realopt.topdir = worker.reqopt.ssemain.topdir;
        newreqopt = createSSEMainRequest(realopt, worker.reqopt.ssemain.stockcode, worker.reqopt.ssemain.idx);
        newreqopt.ssemain.ssetries = worker.reqopt.ssemain.ssetries + 1;
        grab.queue(newreqopt.ssemain.queryurl, newreqopt);
    } else {
        jstracer.error(1, '[%s] [%s] failed totally', worker.reqopt.ssemain.ssetries, worker.reqopt.ssemain.queryurl);
    }
    return;
};

function getResulturls(res) {
    'use strict';
    var hrefs = [];
    var idx;
    var info;
    var curinfo;
    var expr;
    var m;
    var totalfname = '';
    for (idx = 0; idx < res.result.length; idx += 1) {
        info = res.result[idx];
        if (baseop.is_non_null(info, 'URL')) {
            curinfo = {};
            curinfo.url = util.format('http://www.sse.com.cn%s', info.URL);
            expr = new RegExp("\\/([\\d]+)\\-[\\d]+\\-[\\d]+\\/");
            m = expr.exec(curinfo.url);
            if (m !== undefined && m !== null && m.length > 1) {
                curinfo.year = m[1];
                totalfname = m[0];
                totalfname = totalfname.replace(/-/g, '');
                totalfname = totalfname.replace(/\//g, '');
                /*now we should make the total name*/
                totalfname = util.format('%s_%s', totalfname, path.basename(info.URL));
                curinfo.downloadfile = totalfname;
                hrefs.push(curinfo);
            } else {
                jstracer.warn('[%s] [%s] not valid ', idx, curinfo.url);
            }
        }
    }
    return hrefs;
}



function addSSEMainCode(options, stockcode) {
    'use strict';
    var realopt = {};
    var d;
    var realstockcode = '600001';
    var newreqopt;
    var curopt = null;
    var idx;
    var years;

    realopt.maxtries = 5;
    realopt.topdir = process.cwd();
    realopt.startdate = '1999-01-01';
    d = new Date();
    realopt.enddate = '';
    realopt.enddate += baseop.number_format_length(4, d.getFullYear());
    realopt.enddate += '-';
    realopt.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    realopt.enddate += '-';
    realopt.enddate += baseop.number_format_length(2, d.getDate());
    if (stockcode !== undefined && stockcode !== null) {
        realstockcode = stockcode;
    }

    if (baseop.is_non_null(options, 'maxtries')) {
        realopt.maxtries = options.maxtries;
    }

    if (baseop.is_non_null(options, 'topdir')) {
        realopt.topdir = options.topdir;
    }

    if (baseop.is_valid_string(options, 'startdate') && options.startdate.length === 8) {
        realopt.startdate = '';
        realopt.startdate += options.startdate.substring(0, 4);
        realopt.startdate += '-';
        realopt.startdate += options.startdate.substring(4, 6);
        realopt.startdate += '-';
        realopt.startdate += options.startdate.substring(6, 8);
    }

    if (baseop.is_valid_string(options, 'enddate') && options.enddate.length === 8) {
        realopt.enddate = '';
        realopt.enddate += options.enddate.substring(0, 4);
        realopt.enddate += '-';
        realopt.enddate += options.enddate.substring(4, 6);
        realopt.enddate += '-';
        realopt.enddate += options.enddate.substring(6, 8);
    }

    years = baseop.split_by_oneyear(realopt.startdate, realopt.enddate);
    for (idx = 0; idx < years.length; idx += 1) {
        curopt = Object.assign({}, realopt);
        curopt.startdate = years[idx].startdate;
        curopt.enddate = years[idx].enddate;
        newreqopt = createSSEMainRequest(curopt, realstockcode, 1);
        grab.queue(newreqopt.ssemain.queryurl, newreqopt);
        curopt = null;
    }
    return;
}

function createSSEMain(options) {
    'use strict';
    var sse = {};
    if (options !== undefined && options !== null) {
        options = options;
    }

    sse.post_handler = function (err, worker, next) {
        var res;
        var jsons;
        var lengthsize;
        var idx;
        var hrefs;
        var curdir;
        var newreqopt;
        if (!baseop.is_non_null(worker.reqopt, 'ssemain')) {
            next(true, err);
            return;
        }

        if (err !== undefined && err !== null) {
            jstracer.warn('[%s] query [%s] failed', worker.reqopt.ssemain.ssetries, worker.reqopt.ssemain.queryurl);
            errorCreateSSEMainRequest(worker);
            return;
        }
        jsons = worker.htmldata;
        if (!jsons.startsWith(worker.reqopt.ssemain.callbackstr)) {
            jstracer.warn('[%s] query [%s] return [%s]', worker.reqopt.ssemain.ssetries, worker.reqopt.ssemain.queryurl, worker.htmldata);
            errorCreateSSEMainRequest(worker);
            return;
        }
        /*to omit the (*/
        jsons = jsons.substr(worker.reqopt.ssemain.callbackstr.length + 1);
        lengthsize = jsons.length;
        /*we filter the last )*/
        jsons = jsons.substr(0, lengthsize - 1);
        try {
            res = JSON.parse(jsons);
        } catch (e) {
            jstracer.error('not valid res for [%s]\n[%s]\n[%s]\nerror[%s]', worker.reqopt.ssemain.queryurl, worker.htmldata, jsons, e);
            errorCreateSSEMainRequest(worker);
            return;
        }

        if (baseop.is_non_null(res, 'result')) {
            jstracer.trace('[%s=>%s][%s]result len [%s]', worker.reqopt.ssemain.startdate, worker.reqopt.ssemain.enddate, worker.reqopt.ssemain.idx, res.result.length);
            if (res.result.length > 0) {
                hrefs = getResulturls(res);
                for (idx = 0; idx < hrefs.length; idx += 1) {
                    newreqopt = {};
                    newreqopt.downloadoption = {};
                    curdir = path.join(worker.reqopt.ssemain.topdir, worker.reqopt.ssemain.stockcode, hrefs[idx].year);
                    newreqopt.downloadoption.downloadfile = path.join(curdir, hrefs[idx].downloadfile);
                    grab.download_queue(hrefs[idx].url, curdir, newreqopt);
                    curdir = null;
                }
                /*we have find the workers ,so we should make request more*/
                succCreateSSEMainRequest(worker);
            }
            return;
        }
        jstracer.error('[%s] in res [%s]', worker.reqopt.ssemain.queryurl, worker.htmldata);
        errorCreateSSEMainRequest(worker);
        return;
    };
    return sse;
}

module.exports = createSSEMain;
module.exports.addSSEMainCode = addSSEMainCode;