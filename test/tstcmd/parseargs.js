var string_to_bytes = function (instr) {
    'use strict';
    var ch, i;
    var bytes = [];
    for (i = 0; i < instr.length; i += 1) {
        ch = instr.charCodeAt(i);
        if ((ch & 0xff00) > 0) {
            bytes.push((ch & 0xff) >> 8);
            ch = ch >> 8;
        }

        bytes.push(ch);
    }
    return bytes;
};

var bytes_to_string = function (bytes) {
    'use strict';
    return bytes.toString('ascii');
};

process.argv.forEach(function (elm, idx) {
    'use strict';
    var bytes = string_to_bytes(elm);
    var msg = bytes_to_string(bytes);
    console.log('[%d] (%s) bytes (%s) convert(%s)', idx, elm, bytes, msg);
});