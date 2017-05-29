var cheerio = require('cheerio');
var baseop = require('../../baseop');
//var util = require('util');

exports.get_list_dirs = function (content) {
    'use strict';
    var listdirs = [];
    var parser, selects;
    var i;
    var svg;
    var a;
    var item;
    parser = cheerio.load(content, {
        xmlMode: true,
        ignoreWhitespace: true
    });

    selects = parser('tbody tr');
    for (i = 0; i < selects.length; i += 1) {
        svg = selects.eq(i).find('svg');
        a = selects.eq(i).find('a');
        if (baseop.is_valid_string(svg[0].attribs, 'class')) {
            if (baseop.has_sub_string(svg.attr('class'), 'octicon-file-directory') || baseop.has_sub_string(svg.attr('class'), 'octicon-file-text')) {
                item = {};
                if (baseop.has_sub_string(svg[0].attribs.class, 'octicon-file-directory')) {
                    item.type = 'dir';
                } else if (baseop.has_sub_string(svg.attr('class'), 'octicon-file-text')) {
                    item.type = 'file';
                }
                item.href = a[0].attribs.href;
                listdirs.push(item);
            }
        }
    }

    return listdirs;
};

exports.get_raw_url = function (content) {
    'use strict';
    var parser, selects;
    var i, j;
    var ahrefs;

    parser = cheerio.load(content, {
        xmlMode: true,
        ignoreWhitespace: true
    });
    selects = parser('div.BtnGroup');
    for (i = 0; i < selects.length; i += 1) {
        ahrefs = selects.eq(i).find('a');
        for (j = 0; j < ahrefs.length; j += 1) {
            if (baseop.match_expr_i(ahrefs.eq(j).text(), '^raw$')) {
                return ahrefs.eq(j).attr('href');
            }
            if (baseop.match_expr_i(ahrefs.eq(j).text(), '^download$')) {
                return ahrefs.eq(j).attr('href');
            }
        }
    }
    return null;
};