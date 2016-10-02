var cheerio = require('cheerio');
var tracelog = require('../../tracelog');

exports.get_list_dirs = function (content) {
    'use strict';
    var listdirs = {};
    var parser, selects;
    var i;
    parser = cheerio.load(content, {
        xmlMode: true,
        ignoreWhitespace: true
    });

    selects = parser('tbody tr');
    for (i = 0; i < selects.length; i += 1) {
        tracelog.info('selects[%d] %s', i, selects.eq(i));
    }

    return listdirs;
};