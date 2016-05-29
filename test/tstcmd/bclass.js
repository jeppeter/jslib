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