var qs = require('querystring');

process.argv.forEach(function (elm, idx) {
    'use strict';
    var encstr, decstr;
    if (idx >= 2) {
        var i, buf;
        buf = new Buffer(elm);
        for (i = 0; i < buf.length; i += 1) {
            console.log('[%d] 0x%s', i, buf[i].toString(16));
        }
        for (i = 0; i < elm.length; i += 1) {
            console.log('[%d] %s 0x%s', i, elm[i], elm[i].toString(16));
        }
        encstr = qs.escape(elm);
        decstr = qs.unescape(encstr);
        console.log('str %s qs (%s) uneq(%s)', elm, encstr, decstr);
    }
});