var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var cheerio = require('cheerio');
var URL = require('url');

function createMain(options) {
    'use strict';
    var mainobj;
    options = options;
    mainobj = {};
    mainobj.options = {};
    mainobj.options.stockcode = '600000';
    return mainobj;
}

module.exports = createMain;