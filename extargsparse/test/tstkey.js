var test = require('tape');
var KeyParser = require('../');

var opt_fail_check = function (t, keycls) {
    'use strict';
    var val;
    var ok;
    var err;

    ok = false;
    try {
        val = keycls.longopt;
        val = val;
    } catch (e) {
        err = e;
        ok = true;
    }
    t.assert(ok, 'will not get longopt ');

    ok = false;
    try {
        val = keycls.shortopt;
    } catch (e2) {
        err = e2;
        ok = true;
    }

    t.assert(ok, 'will not get shortopt');

    ok = false;
    try {
        val = keycls.optdest;
    } catch (e3) {
        err = e3;
        ok = true;
    }
    err = err;
    t.assert(ok, 'will not get optdest');
    return t;
};

test('A001', function (t) {
    'use strict';
    var keycls;

    keycls = new KeyParser('', '$flag|f+type', 'string', false);
    t.assert(keycls.flagname === 'flag');
    t.assert(keycls.longopt === '--type-flag');
    t.assert(keycls.shortopt === '-f');
    t.assert(keycls.optdest === 'type_flag');
    t.assert(keycls.value === 'string');
    t.assert(keycls.type === 'string');
    t.assert(keycls.shortflag === 'f');
    t.assert(keycls.prefix === 'type');
});