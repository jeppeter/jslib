var jstracer = require('jstracer');
var cheerio = require('cheerio');
var qs = require('querystring');
var util = require('util');
var URL = require('url');
var grabcheerio = require('./grabcheerio');
var path = require('path');
var baseop = require('../../baseop');
var grabwork = require('../../grabwork');

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



function createHkexNewsPaperPost(opt) {
    'use strict';
    var hknews = {};
    var options = opt || {};

    hknews.lastdate = null;
    hknews.maxtries = 5;

    if (baseop.is_non_null(options, 'maxtries')) {
        hknews.maxtries = options.maxtries;
    }

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
        var getenddate, curlastdate;
        //jstracer.trace('newspaper');
        /*jstracer.info('worker (%s)', util.inspect(worker, {
            showHidden: true,
            depth: null
        }));*/

        if (!baseop.is_non_null(worker.reqopt, 'hkexnewspaperoption')) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }


        if (err) {
            var tries = 0;
            /*we have handler this functions*/
            if (baseop.is_non_null(worker.reqopt.hkexnewspaperoption, "tries")) {
                tries = worker.reqopt.hkexnewspaperoption.tries;
            }
            tries += 1;
            if (tries < hknews.maxtries) {
                if (hknews.lastdate !== null) {
                    worker.parent.queue(worker.url, {
                        hkexnewsmainoption: {
                            enddate: hknews.lastdate,
                            tries: tries
                        }
                    });
                } else {
                    worker.parent.queue(worker.url, {
                        hkexnewsmainoption: {
                            tries: tries
                        }
                    });
                }
            } else {
                jstracer.error('query %s really failed', worker.url);
            }

            next(false, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        //jstracer.trace('request paper');
        //jstracer.info('htmldata %s', worker.htmldata);
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
                jstracer.error('can not get __VIEWSTATE');
                next(false, null);
                return;
            }

            curval = grabcheerio.get_attr_value(selected, parser, 'value');
            if (curval === '') {
                jstracer.error('can not get __VIEWSTATE');
                next(false, null);
                return;
            }

            postdata = get_post_data(curval);
            //jstracer.info('postdata (%s)', postdata);
            worker.parent.post_queue(worker.url, {
                hkexnewspaperoption: worker.reqopt.hkexnewspaperoption,
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
            downdir = worker.reqopt.hkexnewspaperoption.downdir;
            downdir += path.sep;
            downdir += findres.lists_html[i].year;
            getenddate = baseop.parse_number(findres.lists_html[i].enddate);
            curlastdate = baseop.parse_number(hknews.lastdate);
            if (curlastdate > getenddate) {
                /*we refresh date for it will give the date*/
                hknews.lastdate = findres.lists_html[i].enddate;
            }


            if (baseop.match_expr_i(cururl, '\.pdf$')) {
                /*store by year */
                worker.parent.download_queue(cururl, downdir, {
                    priority: grabwork.MAX_PRIORITY
                });
            } else if (baseop.match_expr_i(cururl, '\.htm[l]?$')) {
                jstracer.info('will more query (%s)', cururl);
                worker.parent.queue(cururl, {
                    hkexnewsextendoption: {
                        downloaddir: downdir
                    },
                    reuse: true
                });
            } else {
                jstracer.info('unknown url (%s)', cururl);
            }
        }
        next(false, null);
        return;
    };

    return hknews;
}


module.exports = createHkexNewsPaperPost;