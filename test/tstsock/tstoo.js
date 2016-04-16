var format_tabs = function (tabs) {
    'use strict';
    var i;
    var s;
    s = '';

    for (i = 0; i < tabs; i += 1) {
        s += '    ';
    }
    return s;
};

var xinspect = function (o, tabs) {
    'use strict';
    var s;
    var p;
    var t;
    var cnt;
    var keys;
    var i;

    s = '{';
    cnt = 0;
    keys = Object.getOwnPropertyNames(o);
    for (i = 0; i < keys.length; i += 1) {
        try {
            p = keys[i];
            t = o[p];
            if (cnt > 0) {
                s += ',\n';
            }
            if ('Object' === typeof t) {
                s += format_tabs(tabs);
                s += p + ' : ' + Object.apply('xinspect', t, tabs + 1);
            } else {
                s += format_tabs(tabs);
                s += p + ' : "' + t + '"';
            }
            cnt += 1;
        } catch (err) {
            console.log('%s', JSON.stringify(err));
        }
    }
    s += '\n';
    s += format_tabs(tabs);
    s += '}\n';
    return s;
};

console.log(xinspect(xinspect, 0));