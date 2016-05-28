var util = require('util');

var CreateReadOnly = function (opt) {
    'use strict';
    var self;
    var dictionary;
    var readwords = ['size', 'news'];

    dictionary = {};
    dictionary.size = 20;
    dictionary.news = 'hello';
    if (typeof opt.size === 'number') {
        dictionary.size = opt.size;
    }

    if (typeof opt.news === 'string') {
        dictionary.news = opt.news;
    }
    self = {};

    readwords.forEach(function (elm) {
        Object.defineProperty(self, elm, {
            enumerable: true,
            get: function () {
                return dictionary[elm];
            },
            set: function (v) {
                var errstr;
                v = v;
                errstr = util.format('can not set (%s)', elm);
                throw new Error(errstr);
            }
        });
    });


    return self;
};

module.exports.init = CreateReadOnly;