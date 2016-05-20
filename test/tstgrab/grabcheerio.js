var tracelog = require('../../tracelog');
var cheerio = require('cheerio');
var inner_get_text_html = function (elm, parser) {
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

module.exports.get_text_html = inner_get_text_html;

var inner_get_br_text = function (elm, parser) {
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


module.exports.get_br_text = inner_get_br_text;


var inner_get_number_list = function (value) {
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

module.exports.get_number_list = inner_get_number_list;

var inner_match_expr = function (value, expr) {
    'use strict';
    var reg;

    reg = new RegExp(expr);
    if (reg.test(value)) {
        return true;
    }
    return false;
};


module.exports.match_expr = inner_match_expr;

var inner_match_expr_i = function (value, expr) {
    'use strict';
    var reg;

    reg = new RegExp(expr, 'i');
    if (reg.test(value)) {
        return true;
    }
    return false;
};

module.exports.match_expr_i = inner_match_expr_i;

var inner_get_attr_value = function (elm, parser, keyname) {
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

module.exports.get_attr_value = inner_get_attr_value;

module.exports.find_query_result = function (htmldata) {
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
            curval = inner_get_attr_value(curspan, parser, 'id');
            if (inner_match_expr(curval, '_lbDateTime$')) {
                /*now we get the year value*/
                curval = inner_get_text_html(curspan, parser);
                if (curval !== '') {
                    curbr = curspan.find('br');
                    if (curbr.length > 0) {
                        brval = inner_get_br_text(curbr, parser);
                        curval = curval.replace(brval, '');
                        sarr = curval.split('/');
                        if (sarr.length >= 3) {
                            year = sarr[2];
                        }
                    }
                }
            } else if (inner_match_expr(curval, '_lbShortText$')) {
                cura = curtr.find('a');
                if (cura.length > 0) {
                    curval = inner_get_attr_value(cura, parser, 'href');
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
    value = inner_get_text_html(selected, parser);
    if (value === '') {
        tracelog.error('nothing to handle');
        return null;
    }
    num = inner_get_number_list(value);
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

module.exports.more_query_html = function (htmldata) {
    'use strict';
    var htmllists;
    var ahrefs;
    var idx;
    var cura;
    var curval;
    var parser;
    parser = cheerio.load(htmldata);
    htmllists = [];

    ahrefs = parser('a');
    tracelog.info('ahrefs %d', ahrefs.length);
    for (idx = 0; idx < ahrefs.length; idx += 1) {
        cura = ahrefs.eq(idx);
        curval = inner_get_attr_value(cura, parser, 'href');
        if (curval.length > 0) {
            if (inner_match_expr_i(curval, '\.pdf$')) {
                tracelog.info('curval (%s)', curval);
                htmllists.push(curval);
            } else {
                tracelog.info('curval unknown (%s)', curval);
            }
        }
    }
    return htmllists;

};