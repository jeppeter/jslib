var extargsparse = require('../index');
var test = require('tape');
var tracelog = require('../../tracelog');
var util = require('util');
tracelog.Init({
    level: 'trace'
});

var get_notice = function (t, name) {
    'use strict';
    return util.format('%s %s', t.name, name);
};