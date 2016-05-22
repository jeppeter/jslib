var tracelog = require('../../tracelog');
var baseop = require('../../baseop');
var util = require('util');
var URL = require('url');
var path = require('path');
var grabwork = require('../../grabwork');

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
        var totalget;
        var sendcninfoquery;
        var curdowndir;
        var sarr;
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
                        body: postdata
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

        if (!baseop.is_non_null(parser, 'announcements')) {
            err2 = new Error('can not get announcements');
            tracelog.error('%s', err2);
            next(false, err2);
            return;
        }

        if (!baseop.is_non_null(parser, 'totalAnnouncement')) {
            err2 = new Error('can not get totalAnnouncement');
            tracelog.error('%s', err2);
            next(false, err2);
            return;
        }

        urlparser = URL.parse(worker.url);
        hosturl = '';
        hosturl += util.format('%s//%s/', urlparser.protocol, urlparser.host);
        curdowndir = cnquery.options.topdir;
        curdowndir += path.sep;
        sarr = cninfoquery.startdate.split('-');
        curdowndir += util.format('%s', sarr[0]);

        if (cninfoquery.retry === 0) {
            /*it means it is the first time to send it ,so we should make sure it has something to query for*/
            totalget = cninfoquery.pagesize * (cninfoquery.pagenum - 1);
            totalget += parser.anountments.length;
            sendcninfoquery = cninfoquery;
            if (totalget < parser.totalAnnouncement) {
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
                        body: postdata
                    }
                });
            }
        }


        /*ok we should get all the anountments*/
        for (i = 0; i < parser.anountments.length; i += 1) {
            curannounce = parser.anountments[i];
            if (baseop.is_non_null(curannounce, 'adjunctUrl')) {
                if (baseop.match_expr_i(curannounce.adjunctUrl, '\.pdf$')) {
                    downpdf = hosturl;
                    downpdf += curannounce.adjunctUrl;
                    tracelog.info('<%s> down (%s)', downpdf, curdowndir);
                    worker.parent.queue(downpdf, {
                        priority: grabwork.MAX_PRIORITY,
                        downloaddir: curdowndir
                    });
                } else {
                    tracelog.warn('<%s:%s>[%d] not pdf (%s)', cninfoquery.stockcode, cninfoquery.startdate, i, curannounce.adjunctUrl);
                }
            } else {
                tracelog.warn('<%s:%s>[%d] announcements not ', cninfoquery.stockcode, cninfoquery.startdate, i);
            }
        }

        next(false, null);
        return;
    };

    return cnquery;
}

module.exports = createCninfoQuery;