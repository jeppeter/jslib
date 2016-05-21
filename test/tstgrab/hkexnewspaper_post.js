var tracelog = require('../../tracelog');
var cheerio = require('cheerio');
var qs = require('querystring');
var util = require('util');
var URL = require('url');
var grabcheerio = require('./grabcheerio');
var path = require('path');
var baseop = require('../../baseop');

var get_post_data = function (viewstate) {
    'use strict';
    var postdata;
    var ctl00_dollar = 'ctl00$';
    postdata = '__VIEWSTATE=';
    postdata += qs.escape(viewstate);
    postdata += '&__VIEWSTATEENCRYPTED=&';
    postdata += util.format('%sbtnNext.x=32&', qs.escape(ctl00_dollar));
    postdata += util.format('%sbtnNext.y=11', qs.escape(ctl00_dollar));
    return postdata;
};



function createHkexNewsPaperPost() {
    'use strict';
    var hknews = {};

    hknews.post_handler = function (err, worker, next) {
        var parser, selected;
        var curval;
        var postdata;
        var findres;
        var i;
        var host;
        var proto, urlparse;
        var cururl;
        var downdir;
        //tracelog.trace('newspaper');
        /*tracelog.info('worker (%s)', util.inspect(worker, {
            showHidden: true,
            depth: null
        }));*/

        if (!baseop.is_valid_string(worker.reqopt, 'hkexnewspaper')) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }


        if (err) {
            /*we have handler this functions*/
            next(false, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        //tracelog.trace('request paper');
        //tracelog.info('htmldata %s', worker.htmldata);
        parser = cheerio.load(worker.htmldata);
        findres = grabcheerio.find_query_result(worker.htmldata);
        if (findres === null || findres.lists_html.length === 0) {
            /*we find nothing to handle*/
            next(true, null);
            return;
        }

        /*now we should get the next page*/
        if (findres.next) {
            /*it means that we should get the next value*/
            selected = parser('#__VIEWSTATE');
            if (selected.length === 0) {
                tracelog.error('can not get __VIEWSTATE');
                next(false, null);
                return;
            }

            curval = grabcheerio.get_attr_value(selected, parser, 'value');
            if (curval === '') {
                tracelog.error('can not get __VIEWSTATE');
                next(false, null);
                return;
            }

            postdata = get_post_data(curval);
            //tracelog.info('postdata (%s)', postdata);
            worker.parent.post_queue(worker.url, {
                hkexnewspaper: worker.reqopt.hkexnewspaper,
                reuse: true,
                reqopt: {
                    body: postdata,
                    timeout: 10000,
                    headers: {
                        Referer: worker.url,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            });
        }

        urlparse = URL.parse(worker.url);
        proto = urlparse.protocol;
        host = urlparse.host;

        for (i = 0; i < findres.lists_html.length; i += 1) {
            cururl = proto;
            cururl += '//';
            cururl += host;
            cururl += findres.lists_html[i].href;
            downdir = worker.reqopt.hkexnewspaper;
            downdir += path.sep;
            downdir += findres.lists_html[i].year;
            if (baseop.match_expr_i(cururl, '\.pdf$')) {
                /*store by year */
                tracelog.info('downdir (%s)', downdir);
                worker.parent.post_queue(cururl, {
                    hkexnewsdownloaddir: downdir
                });
            } else if (baseop.match_expr_i(cururl, '\.htm[l]?$')) {
                tracelog.info('will more query (%s)', cururl);
                worker.parent.queue(cururl, {
                    hkexnewsextenddir: downdir,
                    reuse: true,
                    reqopt: {
                        body: postdata,
                        timeout: 10000
                    }
                });
            } else {
                tracelog.info('unknown url (%s)', cururl);
            }
        }
        next(false, null);
        return;
    };

    return hknews;
}


module.exports = createHkexNewsPaperPost;