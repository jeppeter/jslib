var crypto = require('crypto');

crypto.randomBytes(1, function (err, buffer) {
    'use strict';
    var hex;
    var num;
    if (err) {
        return;
    }
    hex = buffer.toString('hex');
    num = parseInt(hex, 16);
    num %= 256;
    console.log('random %d', num);
    return;
});