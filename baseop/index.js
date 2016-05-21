var fs = require('fs');
var path = require('path');
var tracelog = require('../tracelog');
var util = require('util');
module.exports.remove_array = function (array, elm) {
    'use strict';
    if (Array.isArray(array)) {
        array = array.filter(function (e) {
            return e !== elm;
        });
    }
    return array;
};

module.exports.is_valid_string = function (opt, name, minlen) {
    'use strict';
    var isvalid = false;
    if (minlen === undefined || minlen === null || typeof minlen !== 'number' || minlen < 0) {
        minlen = 0;
    }
    if (opt[name] !== null && opt[name] !== undefined && typeof opt[name] === 'string' && opt[name].length > minlen) {
        isvalid = true;
    }
    return isvalid;
};

module.exports.is_valid_bool = function (opt, name) {
    'use strict';
    var isvalid = false;
    if (opt[name] !== null && opt[name] !== undefined && typeof opt[name] === 'boolean' && opt[name]) {
        isvalid = true;
    }
    return isvalid;
};

module.exports.is_in_array = function (array, elm) {
    'use strict';
    var isin = false;
    if (Array.isArray(array) && elm !== null && elm !== undefined) {
        if (array.indexOf(elm) >= 0) {
            isin = true;
        }
    }
    return isin;
};

var is_root = function (elm) {
    'use strict';
    var realpath;
    var isroot = false;
    var iswin = false;
    if (/^win/.test(process.platform)) {
        iswin = true;
    }
    realpath = path.resolve(elm);
    if (iswin) {
        if (realpath.length === 3 && realpath[1] === ':') {
            isroot = true;
        } else if (realpath.length < 2) {
            isroot = true;
        }
    } else {
        if (realpath.length === 1 && realpath[0] === '/') {
            isroot = true;
        }
    }
    return isroot;
};

module.exports.is_root = is_root;

function CreateMkdirCallState(dirname, downstate) {
    'use strict';
    var newstate;
    newstate = {};
    newstate.call_fn = null;
    newstate.call_upper = null;
    newstate.call_down = null;
    newstate.inner_fn = null;
    newstate.pathname = dirname;
    newstate.next = null;
    if (downstate !== undefined && downstate !== null) {
        newstate.call_fn = downstate.call_fn;
        newstate.call_upper = downstate.call_upper;
        newstate.call_down = downstate.call_down;
        newstate.inner_fn = downstate.inner_fn;
        newstate.next = downstate;
    }
    return newstate;
}


var __mkdir_upstream = function (callstate) {
    'use strict';
    var newcallstate = null;
    var parentdir;
    var isroot;
    var err;

    isroot = is_root(callstate.pathname);
    if (isroot) {
        err = new Error('no such file');
        err.code = 'ENOENT';
        callstate.call_down(err, callstate);
        return;
    }
    parentdir = path.resolve(callstate.pathname, '..');
    newcallstate = new CreateMkdirCallState(parentdir, callstate);
    tracelog.info('call up %s', parentdir);
    newcallstate.inner_fn(null, newcallstate);
    return;
};

var __mkdir_downstream = function (err, callstate) {
    'use strict';
    var newstate;
    newstate = callstate.next;
    if (newstate !== null) {
        newstate.inner_fn(err, newstate);
    } else {
        callstate.call_fn(err);
    }
    return;
};


var __mkdir_inner = function (err, callstate) {
    'use strict';
    if (err) {
        callstate.call_down(err, callstate);
        return;
    }

    fs.mkdir(callstate.pathname, function (err) {
        if (err) {
            if (err.code === 'EEXIST') {
                /*ok we create it*/
                callstate.call_down(null, callstate);
                return;
            }
            if (err.code === 'ENOENT') {
                callstate.call_upper(callstate);
                return;
            }
            callstate.call_down(err, callstate);
            return;
        }

        callstate.call_down(null, callstate);
        return;
    });
    return;
};

var mkdir_safe = function (dirname, callback) {
    'use strict';
    var callstate;
    var realpath;
    realpath = path.resolve(dirname);
    callstate = new CreateMkdirCallState(realpath, null);
    callstate.call_down = __mkdir_downstream;
    callstate.call_fn = callback;
    callstate.call_upper = __mkdir_upstream;
    callstate.inner_fn = __mkdir_inner;
    callstate.inner_fn(null, callstate);
    return;
};

module.exports.mkdir_safe = mkdir_safe;

var number_format_length = function (size, number) {
    'use strict';
    var s = '';
    var idx;
    for (idx = 0; idx < size; idx += 1) {
        s += '0';
    }
    s += util.format('%d', number);
    return s.slice(-size);
};

module.exports.number_format_length = number_format_length;

var match_expr = function (value, expr) {
    'use strict';
    var reg;

    reg = new RegExp(expr);
    if (reg.test(value)) {
        return true;
    }
    return false;
};


module.exports.match_expr = match_expr;

var match_expr_i = function (value, expr) {
    'use strict';
    var reg;

    reg = new RegExp(expr, 'i');
    if (reg.test(value)) {
        return true;
    }
    return false;
};

module.exports.match_expr_i = match_expr_i;

var monthday_least = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

var is_valid_date = function (datestr) {
    'use strict';
    var isvalid = false;
    var isleap = false;
    var year, month, day;
    if (typeof datestr === 'string' && datestr.length === 8 && match_expr_i(datestr, '[0-9]+')) {
        year = parseInt(datestr.substring(0, 4));
        month = parseInt(datestr.substring(4, 6));
        day = parseInt(datestr.substring(6, 8));
        if (month <= 12 && month > 0 && year >= 1900 && day <= 31 && day > 0) {
            if (day <= monthday_least[month - 1]) {
                isvalid = true;
            } else if (month === 2) {
                if ((year % 4) === 0) {
                    isleap = true;
                    if ((year % 100) === 0 && (year % 400) !== 0) {
                        isleap = false;
                    }
                }

                if (isleap && day <= 29) {
                    isvalid = true;
                }
            }

        }
    }
    return isvalid;
};

module.exports.is_valid_date = is_valid_date;