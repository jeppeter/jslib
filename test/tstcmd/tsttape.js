var test = require("tape");
var readaccess = require('./readaccess');
var util = require('util');

test('first_pass', function first_pass(t) {
    'use strict';
    var rd;
    var ok;
    /*
    console.log('t (%s)', util.inspect(t, {
        showHidden: true,
        depth: null
    }));*/
    rd = readaccess.init({
        size: 50,
        news: 'new set'
    });

    t.assert(rd.size === 50, 'size read');
    t.assert(rd.news === 'new set', 'news read');

    ok = false;
    try {
        rd.size = 70;
    } catch (err) {
        util.inspect(err);
        ok = true;
    }
    t.assert(ok, 'can not set size');

    ok = false;
    try {
        rd.news = 'no news';
    } catch (err2) {
        util.inspect(err2);
        ok = true;
    }
    t.assert(ok, 'can not set news');
    t.end();
});

test('readonly', function (t) {
    'use strict';
    t.pass('pass readonly');
    t.end();
});