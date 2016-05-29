var hello_call = function (name) {
    'use strict';
    console.log('hello (%s)', name);
    return name;
};

var goodbye_call = function (name) {
    'use strict';
    console.log('goodbye (%s)', name);
    return name;
};

exports.hello_call = hello_call;
exports.goodbye_call = goodbye_call;

var callfunc = require('./callfunc');

if (process.argv.length > 3) {
    callfunc.call_args_function(process.argv[2], process.argv[3], null);
}