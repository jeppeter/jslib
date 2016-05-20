var fs = require('fs');
var path = require('path');
var tracelog = require('../tracelog');
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