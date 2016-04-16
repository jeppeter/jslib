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
    s = '{';

    for (p in o) {
        t = o[p];
        if (typeof (t) === 'Object') {
            s += format_tabs(tabs);
            s += p + ':' + xinspect.apply(xinspect, t, tabs + 1);
        } else {
            s += format_tabs(tabs);
            s += p + ':' + t + '\n';
        }
    }

    s += format_tabs(tabs);
    s += '}\n';
    return s;
};

console.log(xinspect(console));