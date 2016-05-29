var test = require('tape');
var KeyParser = require('../keyparse');
var tracelog = require('../../tracelog');
var util = require('util');
tracelog.Init({
    level: 'trace'
});


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

var get_notice = function (t, name) {
    'use strict';
    return util.format('%s %s', t.name, name);
};

test('A001', function (t) {
    'use strict';
    var keycls;
    keycls = new KeyParser('', '$flag|f+type', 'string', false);
    t.equal(keycls.flagname, 'flag', get_notice(t, 'flag'));
    t.equal(keycls.longopt, '--type-flag', get_notice(t, 'longopt'));
    t.equal(keycls.shortopt, '-f', get_notice(t, 'shortopt'));
    t.equal(keycls.optdest, 'type_flag', get_notice(t, 'optdest'));
    t.equal(keycls.value, 'string', get_notice(t, 'value'));
    t.equal(keycls.typename, 'string', get_notice(t, 'typename'));
    t.equal(keycls.shortflag, 'f', get_notice(t, 'shortflag'));
    t.equal(keycls.prefix, 'type', get_notice(t, 'prefix'));
    t.end();
});