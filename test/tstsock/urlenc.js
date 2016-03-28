var qs = require('querystring');

process.argv.forEach(function (elm, idx) {
    'use strict';
    var encstr, decstr;
    if (idx >= 2) {
        encstr = qs.escape(elm);
        decstr = qs.unescape(encstr);
        console.log('str %s qs (%s) uneq(%s)', elm, encstr, decstr);
    }
});