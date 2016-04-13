var variadic = require('variadic');
var util = require('util');
var fn = variadic(function (args) {
    'use strict';
    return args;
});


var format_string = function () {
    'use strict';
    return util.format.apply(util, arguments);
};

var call_format_string = function () {
    'use strict';
    return format_string.apply(format_string,arguments);
};


console.log(call_format_string('hello %s', 'world'));
console.log(fn('1 + %d = %d', 1, 2));