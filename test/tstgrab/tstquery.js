var cheerio = require('cheerio');
var fs = require('fs');
var commander = require('commander');
var tracelog = require('../../tracelog');
var util = require('util');

commander
    .version('0.2.0')
    .usage('[options] <file>');


tracelog.init_commander(commander);
commander.parse(process.argv);
tracelog.set_commander(commander);

var trace_exit = function (ec) {
    'use strict';
    tracelog.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};

var get_text_html = function (elm, parser) {
    'use strict';
    var s;
    var textkey = 'text';
    parser = parser;
    s = '';
    if (elm[0] !== null && elm[0] !== undefined) {
        if (typeof elm[0][textkey] === 'function') {
            s += elm[0][textkey]();
        } else if (typeof elm[0][textkey] === 'string') {
            s += elm[0][textkey];
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
    tracelog.info('selected length %d', selected.length);
    /*we should get table*/
    for (i = 0; i < selected.length; i += 1) {
        curtr = selected.eq(i);
        tracelog.info('[%d]curtr (%s)', i, util.inspect(curtr, {
            showHidden: true,
            depth: 1
        }));
        spans = curtr.children('span');
        tracelog.info('[%d] spans %d', i, spans.length);
        year = null;
        href = null;
        for (j = 0; j < spans.length; j += 1) {
            curspan = spans.eq(j);
            curval = get_attr_value(curspan, parser, 'id');
            tracelog.info('id (%s)', curval);
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
        return findres;
    }
    num = get_number_list(value);
    if (num[2] === 0) {
        tracelog.error('get 0 records');
        return findres;
    }

    if (num[1] === num[2]) {
        tracelog.info('get all %d', num[1]);
        return findres;
    }

    findres.next = true;
    return findres;


};

var usage = function (ec, cmd, fmt) {
    'use strict';
    var fp = process.stderr;
    if (ec === 0) {
        fp = process.stdout;
    }

    if (fmt !== undefined && typeof fmt === 'string' && fmt.length > 0) {
        fp.write(util.format('%s\n', fmt));
    }

    cmd.outputHelp(function (txt) {
        fp.write(txt);
        return '';
    });
    trace_exit(ec);
    return;
};


if (commander.args === undefined || commander.args === null || !Array.isArray(commander.args) || typeof commander.args[0] !== 'string' || commander.args[0].length === 0) {
    usage(3, commander, 'please specify a html file');
}

fs.readFile(commander.args[0], function (err, data) {
    'use strict';
    var list_result;
    if (err) {
        tracelog.error('read %s (%s)', commander.args[0], JSON.stringify(err));
        trace_exit(3);
        return;
    }
    list_result = find_query_result(data);
    tracelog.info('list_result (%s)', list_result);
    trace_exit(0);
    return;
});