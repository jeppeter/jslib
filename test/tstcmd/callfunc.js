var util = require('util');

var call_args_function = function (funcname, args, context) {
    'use strict';
    var pkgname;
    var fname;
    var reg;
    var reqpkg;
    var evalstr;
    var sarr, idx;

    reg = new RegExp('\\.', 'i');

    if (reg.test(funcname)) {
        sarr = funcname.split('.');
        pkgname = '';
        for (idx = 0; idx < (sarr.length - 1); idx += 1) {
            if (sarr[idx].length === 0) {
                pkgname += './';
            } else {
                pkgname += sarr[idx];
            }
        }

        fname = sarr[(sarr.length - 1)];
    } else {
        pkgname = process.argv[1];
        fname = funcname;
    }

    reqpkg = require(pkgname);
    if (typeof reqpkg[fname] !== 'function') {
        console.error('%s not function in (%s)', fname, pkgname);
        return args;
    }
    evalstr = util.format('reqpkg.%s', fname);

    Function.prototype.call.call(eval(evalstr), context, args);
    return args;
};

module.exports.call_args_function = call_args_function;