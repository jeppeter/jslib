var test = require("tape");
//var util = require('util');

test('first_pass', function first_pass(t) {
    'use strict';
    t.plan(1);
    /*
    console.log('t (%s)', util.inspect(t, {
        showHidden: true,
        depth: null
    }));*/
    t.assert(true, 'assert true');
});

test('readonly', function (t) {
    'use strict';
    t.plan(1);
    t.pass('pass readonly');
});