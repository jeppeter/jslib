var tracelog = require('../../tracelog');
var cheerio = require('cheerio');
var qs = require('querystring');
var util = require('util');
var URL = require('url');

var get_text_html = function (elm, parser) {
    'use strict';
    var s;
    var textkey = 'text';
    parser = parser;
    s = '';
    if (elm[textkey] !== null && elm[textkey] !== undefined) {
        if (typeof elm[textkey] === 'function') {
            s += elm[textkey]();
        } else if (typeof elm[textkey] === 'string') {
            s += elm[textkey];
        }
    } else if (elm[0] !== null && elm[0] !== undefined) {
        if (typeof elm[0][textkey] === 'function') {
            s += elm[0][textkey]();
        } else if (typeof elm[0][textkey] === 'string') {
            s += elm[0][textkey];
        }
    }
    return s;
};

var get_br_text = function (elm, parser) {
    'use strict';
    var s;
    var curptr;
    parser = parser;
    s = '';
    if (elm[0] !== null && elm[0] !== undefined) {
        curptr = elm[0];
        if (curptr.next !== null && curptr.next !== undefined) {
            curptr = curptr.next;
            if (curptr.data !== null && curptr.data !== undefined) {
                s += curptr.data;
            }
        }
    }

    return s;
};

var get_number_list = function (value) {
    'use strict';
    var num;
    var reg;
    var m;

    num = [];
    num.push(0);
    num.push(0);
    num.push(0);
    reg = new RegExp('[^\\d]+([\\d]+)[^\\d]+([\\d]+)[^\\d]+([\\d]+)[^\\d]+', 'i');
    m = reg.exec(value);
    if (m === undefined || m === null) {
        tracelog.info('value (%s) (%s)', value, m);
        return num;
    }

    if (m.length < 4) {
        tracelog.info('m (%d)', m.length);
        return num;
    }

    num[0] = parseInt(m[1]);
    num[1] = parseInt(m[2]);
    num[2] = parseInt(m[3]);
    return num;
};


var match_expr = function (value, expr) {
    'use strict';
    var reg;

    reg = new RegExp(expr);
    if (reg.test(value)) {
        return true;
    }
    return false;
};

var match_expr_i = function (value, expr) {
    'use strict';
    var reg;

    reg = new RegExp(expr, 'i');
    if (reg.test(value)) {
        return true;
    }
    return false;
};


var get_attr_value = function (elm, parser, keyname) {
    'use strict';
    var s;
    parser = parser;
    s = '';
    if (elm[0] !== null && elm[0] !== undefined) {
        if (elm[0].attribs !== null && elm[0].attribs !== undefined) {
            if (elm[0].attribs[keyname] !== null && elm[0].attribs[keyname] !== undefined) {
                s += elm[0].attribs[keyname];
            }
        }

    } else {
        if (elm.attribs !== null && elm.attribs !== undefined) {
            if (elm.attribs[keyname] !== null && elm.attribs[keyname] !== undefined) {
                s += elm.attribs[keyname];
            }
        }
    }
    return s;
};

var find_query_result = function (htmldata) {
    'use strict';
    var parser;
    var findres;
    var selected;
    var i, curtr, spans, year, href, j, curspan, curval;
    var value;
    var cura, sarr, brval, curbr, curref, num;
    findres = {};
    findres.next = false;
    findres.lists_html = [];
    parser = cheerio.load(htmldata);

    selected = parser('#ctl00_gvMain tr');
    /*we should get table*/
    for (i = 0; i < selected.length; i += 1) {
        curtr = selected.eq(i);
        spans = curtr.find('span');
        year = null;
        href = null;
        for (j = 0; j < spans.length; j += 1) {
            curspan = spans.eq(j);
            curval = get_attr_value(curspan, parser, 'id');
            if (match_expr(curval, '_lbDateTime$')) {
                /*now we get the year value*/
                curval = get_text_html(curspan, parser);
                if (curval !== '') {
                    curbr = curspan.find('br');
                    if (curbr.length > 0) {
                        brval = get_br_text(curbr, parser);
                        curval = curval.replace(brval, '');
                        sarr = curval.split('/');
                        if (sarr.length >= 3) {
                            year = sarr[2];
                        }
                    }
                }
            } else if (match_expr(curval, '_lbShortText$')) {
                cura = curtr.find('a');
                if (cura.length > 0) {
                    curval = get_attr_value(cura, parser, 'href');
                    if (curval !== '') {
                        href = curval;
                    }
                }
            }
        }

        if (year !== null && href !== null) {
            curref = {};
            curref.href = href;
            curref.year = year;
            findres.lists_html.push(curref);
        }
    }
    selected = parser('#ctl00_lblDisplay');
    value = get_text_html(selected, parser);
    if (value === '') {
        tracelog.error('nothing to handle');
        return null;
    }
    num = get_number_list(value);
    if (num[2] === 0) {
        tracelog.error('get 0 records');
        return null;
    }

    if (num[1] === num[2]) {
        tracelog.info('get all %d', num[1]);
        return findres;
    }

    findres.next = true;
    return findres;
};



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
        //tracelog.trace('newspaper');
        if (err) {
            /*if we have nothing to do*/
            tracelog.info('err (%s)', JSON.stringify(err));
            next(true, err);
            return;
        }
        /*tracelog.info('worker (%s)', util.inspect(worker, {
            showHidden: true,
            depth: null
        }));*/

        if (worker.reqopt.hkexnewspaper === undefined || worker.reqopt.hkexnewspaper === null || !worker.reqopt.hkexnewspaper) {
            /*if we do not handle news make*/
            tracelog.info('');
            next(true, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        //tracelog.trace('request paper');
        //tracelog.info('htmldata %s', worker.htmldata);
        parser = cheerio.load(worker.htmldata);
        findres = find_query_result(worker.htmldata);
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

            curval = get_attr_value(selected, parser, 'value');
            if (curval === '') {
                tracelog.error('can not get __VIEWSTATE');
                next(false, null);
                return;
            }

            postdata = get_post_data(curval);
            //tracelog.info('postdata (%s)', postdata);
            worker.parent.post_queue(worker.url, {
                hkexnewspaper: true,
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
            if (match_expr_i(cururl, '\.pdf$')) {
                //tracelog.info('will download (%s)', cururl);
                cururl = cururl;
            } else if (match_expr_i(cururl, '\.htm[l]?$')) {
                tracelog.info('will more query (%s)', cururl);
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