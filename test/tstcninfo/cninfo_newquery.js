var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('grabwork');
var cheerio = require('cheerio');
var URL = require('url');

var get_attr_value = function (elm, parser, keyname) {
    'use strict';
    var s;
    parser = parser;
    s = '';
    if (elm[0] !== null && elm[0] !== undefined) {
        if (elm[0].attribs !== null && elm[0].attribs !== undefined) {
            if (elm[0].attribs[keyname] !== null && elm[0].attribs[keyname] !== undefined) {
                s += elm[0].attribs[keyname];
            }
        }

    } else {
        if (elm.attribs !== null && elm.attribs !== undefined) {
            if (elm.attribs[keyname] !== null && elm.attribs[keyname] !== undefined) {
                s += elm.attribs[keyname];
            }
        }
    }
    return s;
};