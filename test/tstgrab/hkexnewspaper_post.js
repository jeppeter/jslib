var tracelog = require('../../tracelog');
var cheerio = require('cheerio');
var qs = require('querystring');
var util = require('util');

var get_text_html = function (elm, parser) {
    'use strict';
    var s;
    var textkey = 'text';
    parser = parser;
    s = '';
    if (typeof elm[0][textkey] === 'function') {
        s += elm[0][textkey]();
    } else if (typeof elm[0][textkey] === 'string') {
        s += elm[0][textkey];
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
    reg = new RegExp('[^\d]+([\d]+)[^\d]+([\d]+)[^\d]+([\d]+)[^\d]+', 'i');
    m = reg.exec(value);
    if (m === undefined || m === null || m.length < 4) {
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

var get_attr_value = function (elm, parser, keyname) {
    'use strict';
    var s;
    parser = parser;
    s = '';
    if (elm.attribs !== null && elm.attribs !== undefined) {
        if (elm.attribs[keyname] !== null && elm.attribs[keyname] !== undefined) {
            s += elm.attribs[keyname];
        }
    }
    return s;
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
        var value, num, i, j, spans, curtr, curspan, cura, curval, year, href, curbr, brval, sarr;
        var postdata;
        tracelog.trace('newspaper');
        if (err) {
            /*if we have nothing to do*/
            next(true, err);
            return;
        }

        if (worker.reqopt.hkexnewspaper === undefined || worker.reqopt.hkexnewspaper === null || !worker.reqopt.hknexnewspaper) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        tracelog.trace('request paper');
        parser = cheerio.load(worker.htmldata);

        selected = parser('#ctl00_gvMain tr');
        /*we should get table*/
        for (i = 0; i < selected.length; i += 1) {
            curtr = selected.eq(i);
            spans = curtr.children('span');
            year = null;
            href = null;
            for (j = 0; j < spans.length; j += 1) {
                curspan = spans.eq(j);
                curval = get_attr_value(curspan, parser, 'id');
                if (match_expr(curval, '_lbDateTime$')) {
                    /*now we get the year value*/
                    curval = get_text_html(curspan, parser);
                    if (curval !== '') {
                        curbr = curspan.children('br');
                        if (curbr.length > 0) {
                            brval = get_text_html(curbr, parser);
                            curval = curval.replace(brval, '');
                            sarr = curval.split('/');
                            if (sarr.length >= 3) {
                                year = sarr[2];
                            }
                        }
                    }
                } else if (match_expr(curval, '_hlTitle$')) {
                    cura = selected.children('a');
                    if (cura.length > 0) {
                        curval = get_attr_value(cura, 'href');
                        if (curval !== '') {
                            href = curval;
                        }
                    }
                }
            }

            if (year !== null && href !== null) {
                tracelog.info('year (%s) href (%s)', year, href);
            }
        }
        selected = parser('ctl00_lblDisplay');
        value = get_text_html(selected, parser);
        if (value === '') {
            tracelog.error('nothing to handle');
            next(false, null);
            return;
        }
        num = get_number_list(value);
        if (num[2] === 0) {
            tracelog.error('get 0 records');
            next(false, null);
            return;
        }

        if (num[1] === num[2]) {
            tracelog.info('get all %d', num[1]);
            next(false, null);
            return;
        }

        /*now we should get the next page*/
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
        tracelog.info('postdata (%s)', postdata);
        worker.parent.post_queue(worker.url, {
            hkexnewspaper: true,
            reuse: true,
            reqopt: {
                body: postdata
            }
        });
        next(false, null);
        return;
    };

    return hknews;
}


module.exports = createHkexNewsPaperPost;