var jstracer = require('jstracer');
var cheerio = require('cheerio');
var URL = require('url');
var path = require('path');
var baseop = require('../../baseop');

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
        jstracer.info('value (%s) (%s)', value, m);
        return num;
    }

    if (m.length < 4) {
        jstracer.info('m (%d)', m.length);
        return num;
    }

    num[0] = parseInt(m[1]);
    num[1] = parseInt(m[2]);
    num[2] = parseInt(m[3]);
    return num;
};

module.exports.get_number_list = inner_get_number_list;



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
    var enddate;
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
        enddate = null;
        for (j = 0; j < spans.length; j += 1) {
            curspan = spans.eq(j);
            curval = inner_get_attr_value(curspan, parser, 'id');
            if (baseop.match_expr(curval, '_lbDateTime$')) {
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
                            enddate = '';
                            /*year month date*/
                            enddate += baseop.number_format_length(4, sarr[2]);
                            enddate += baseop.number_format_length(2, sarr[1]);
                            enddate += baseop.number_format_length(2, sarr[0]);
                        }
                    }
                }
            } else if (baseop.match_expr(curval, '_lbShortText$')) {
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
            curref.enddate = enddate;
            findres.lists_html.push(curref);
        }
    }
    selected = parser('#ctl00_lblDisplay');
    value = inner_get_text_html(selected, parser);
    if (value === '') {
        jstracer.error('nothing to handle');
        return null;
    }
    num = inner_get_number_list(value);
    if (num[2] === 0) {
        jstracer.error('get 0 records');
        return null;
    }

    if (num[1] === num[2]) {
        jstracer.info('get all %d', num[1]);
        findres.next = false;
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
    for (idx = 0; idx < ahrefs.length; idx += 1) {
        cura = ahrefs.eq(idx);
        curval = inner_get_attr_value(cura, parser, 'href');
        if (curval.length > 0) {
            if (baseop.match_expr_i(curval, '\.pdf$')) {
                htmllists.push(curval);
            } else {
                jstracer.info('curval unknown (%s)', curval);
            }
        }
    }
    return htmllists;
};

var path_to_url = function (dir) {
    'use strict';
    var retval;
    retval = path.resolve(dir);
    if (retval.length >= 2) {
        if (retval[1] === ':') {
            /*it is in windows mode*/
            retval = retval.replace(/[a-zA-Z]\:/, '');
        }
    }

    retval = retval.replace(/\\/g, '/');
    return retval;
};

var inner_combine_dir = function (url, file) {
    'use strict';
    var host;
    var proto;
    var pathname;
    var urlparser;
    var retval;
    var totaldir;

    urlparser = URL.parse(url);
    host = urlparser.host;
    proto = urlparser.protocol;
    pathname = urlparser.pathname;

    retval = proto;
    retval += '//';
    retval += host;

    totaldir = pathname;
    totaldir = path.resolve(totaldir);
    totaldir = path.dirname(totaldir);
    totaldir += '/' + file;
    totaldir = path.resolve(totaldir);
    retval += path_to_url(totaldir);

    return retval;
};

module.exports.combine_dir = inner_combine_dir;