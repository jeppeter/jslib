var tracelog = require('../../tracelog');
var baseop = require('../../baseop');
var util = require('util');
var URL = require('url');
var path = require('path');
var grabwork = require('../../grabwork');

var get_annoucement = function (opt) {
    'use strict';
    var retval = {};
    var i;
    var curelm;
    var curpdf;

    if (!baseop.is_non_null(opt, 'announcements')) {
        tracelog.error('can not get classifiedAnnouncements');
        return null;
    }

    if (!baseop.is_non_null(opt, 'totalAnnouncement')) {
        tracelog.error('can not get totalAnnouncement');
        return null;
    }

    if (!baseop.is_non_null(opt, 'totalRecordNum')) {
        tracelog.error('can not get totalRecordNum');
        return null;
    }

    retval.totalAnnouncement = opt.totalAnnouncement;
    retval.totalRecordNum = opt.totalRecordNum;
    retval.pdfs = [];

    if (opt.announcements.length > 0) {
        for (i = 0; i < opt.announcements.length; i += 1) {
            curelm = opt.announcements[i];
            if (!baseop.is_non_null(curelm, 'adjunctUrl')) {
                tracelog.warn('[%d] no adjunctUrl', i);
            } else {
                curpdf = {};
                curpdf.adjunctUrl = curelm.adjunctUrl;
                retval.pdfs.push(curpdf);
            }
        }
    }


    return retval;
};


function createCninfoQuery(options) {
    'use strict';
    var cnquery;
    cnquery = {};

    cnquery.options = {};
    cnquery.options.stockcode = '600000';
    cnquery.options.topdir = __dirname;
    if (baseop.is_valid_string(options, 'stockcode') && baseop.is_valid_number(options.stockcode, false)) {
        cnquery.options.stockcode = options.stockcode;
    }

    if (baseop.is_valid_string(options, 'topdir')) {
        cnquery.options.topdir = options.topdir;
    }


    cnquery.post_handler = function (err, worker, next) {
        var downpdf;
        var parser;
        var postdata;
        var err2;
        var i;
        var curannounce;
        var cninfoquery;
        var hosturl, urlparser;
        var sendcninfoquery;
        var curdowndir;
        var sarr;
        var querylist;
        var getnum;
        if (!baseop.is_non_null(worker.reqopt, 'cninfoquery')) {
            next(true, err);
            return;
        }

        cninfoquery = worker.reqopt.cninfoquery;

        if (err) {
            /*it is error*/
            postdata = worker.reqopt.reqopt.body;
            tracelog.error('POST (%s) with data (%s) error', worker.url, postdata);
            sendcninfoquery = cninfoquery;
            /*it means we have retry this*/
            sendcninfoquery.retry += 1;
            if (sendcninfoquery.retry < 5) {
                worker.parent.post_queue(worker.url, {
                    reqopt: {
                        body: postdata,
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                        }
                    },
                    cninfoquery: sendcninfoquery
                });
            } else {
                tracelog.error('POST (%s) with data (%s) really failed', worker.url, postdata);
            }
            next(false, err);
            return;
        }


        /*now we should get the data value*/
        try {
            parser = JSON.parse(worker.htmldata);
        } catch (e) {
            tracelog.error('parse (%s) error', worker.htmldata);
            next(false, e);
            return;
        }

        querylist = get_annoucement(parser);
        if (querylist === null) {
            err2 = new Error('can not parse parser');
            tracelog.error('parse (%s) error', worker.htmldata);
            next(false, err2);
            return;
        }

        urlparser = URL.parse(worker.url);
        hosturl = '';
        hosturl += util.format('%s//%s/', urlparser.protocol, urlparser.host);
        curdowndir = cnquery.options.topdir;
        curdowndir += path.sep;
        curdowndir += cninfoquery.stockcode;
        curdowndir += path.sep;
        sarr = cninfoquery.startdate.split('-');
        curdowndir += util.format('%s', sarr[0]);
        sendcninfoquery = cninfoquery;

        if (cninfoquery.retry === 0) {
            /*it means it is the first time to send it ,so we should make sure it has something to query for*/
            getnum = sendcninfoquery.pagesize * (sendcninfoquery.pagenum - 1);
            getnum += querylist.pdfs.length;
            if (getnum < querylist.totalAnnouncement) {
                /*this is the number */
                sendcninfoquery.pagenum += 1;
                postdata = '';
                postdata += util.format('stock=%s', sendcninfoquery.stockcode);
                postdata += util.format('&searchkey=&category=&pageNum=%d&pageSize=%d&', sendcninfoquery.pagenum, sendcninfoquery.pagesize);
                postdata += util.format('column=%s', sendcninfoquery.column);
                postdata += '&tabName=fulltext&sortName=&sortType=&limit=&';
                postdata += util.format('seDate=%s+~+%s', sendcninfoquery.startdate, sendcninfoquery.enddate);
                tracelog.info('send<%s> postdata (%s)', worker.url, postdata);
                worker.parent.post_queue(worker.url, {
                    priority: grabwork.DEF_PRIORITY,
                    cninfoquery: sendcninfoquery,
                    reqopt: {
                        body: postdata,
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                        }
                    }
                });
            }
        }


        /*ok we should get all the anountments*/
        for (i = 0; i < querylist.pdfs.length; i += 1) {
            curannounce = querylist.pdfs[i];
            if (baseop.match_expr_i(curannounce.adjunctUrl, '\.pdf$')) {
                downpdf = hosturl;
                downpdf += curannounce.adjunctUrl;
                tracelog.info('<%s> down (%s)', downpdf, curdowndir);
                worker.parent.download_queue(downpdf, curdowndir, {
                    priority: grabwork.MAX_PRIORITY
                });
            } else {
                tracelog.warn('<%s:%s>[%d] not pdf (%s)', cninfoquery.stockcode, cninfoquery.startdate, i, curannounce.adjunctUrl);
            }
        }

        next(false, null);
        return;
    };

    return cnquery;
}

module.exports = createCninfoQuery;