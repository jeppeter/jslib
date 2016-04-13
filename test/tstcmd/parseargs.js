var util = require('util');

var string_to_bytes = function (instr) {
    'use strict';
    var ch, i;
    var bytes = [];
    for (i = 0; i < instr.length; i += 1) {
        ch = instr.charCodeAt(i);
        console.log('[%d] code %d (0x%s)', i, ch, ch.toString(16));
        bytes.push((ch >> 8) & 0xff);
        ch = ch & 0xff;
        bytes.push(ch);
    }
    return bytes;
};

var bytes_debug = function (bytes) {
    'use strict';
    var msg;
    var i;
    msg = '';

    for (i = 0; i < bytes.length; i += 1) {
        if ((i % 16) === 0) {
            msg += util.format('\n0x%s:\t', i.toString(16));
        }
        msg += util.format(' 0x%s', bytes[i].toString(16));
    }
    msg += '\n';

    return msg;
};

var bytes_to_string = function (bytes) {
    'use strict';
    var msg;
    var i;
    var chh, chl, chcode;
    msg = "";
    for (i = 0; i < bytes.length; i += 2) {
        chh = bytes[i];
        chl = bytes[i + 1];
        chcode = (chh << 8) | (chl);
        msg += String.fromCharCode(chcode);
    }
    return msg;
};

process.argv.forEach(function (elm, idx) {
    'use strict';
    if (idx >= 2) {
        var bytes = string_to_bytes(elm);
        var msg = bytes_to_string(bytes);
        var rebytes = string_to_bytes(msg);
        var dump = bytes_debug(bytes);
        console.log(dump);
        console.log('[%d] (%s) bytes (%s)   convert(%s)', idx, elm, bytes, msg);
        dump = bytes_debug(rebytes);
        console.log(dump);
    }
});