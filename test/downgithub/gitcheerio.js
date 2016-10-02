var cheerio = require('cheerio');
//var tracelog = require('../../tracelog');
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
            if (baseop.has_sub_string(svg[0].attribs.class, 'octicon-file-directory') || baseop.has_sub_string(svg[0].attribs.class, 'octicon-file-text')) {
                item = {};
                if (baseop.has_sub_string(svg[0].attribs.class, 'octicon-file-directory')) {
                    item.type = 'dir';
                } else {
                    item.type = 'file';
                }
                item.href = a[0].attribs.href;
                listdirs.push(item);
            }
        }
    }

    return listdirs;
};