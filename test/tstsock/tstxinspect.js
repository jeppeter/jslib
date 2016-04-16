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
    var cnt =0;
    s = '';
    s += format_tabs(tabs);
    s += '{\n';

    for (p in o) {
        t = o[p];
        if (cnt > 0){
            s += ',\n';
        }
        if (typeof (t) === 'Object') {
            s += format_tabs(tabs);
            s += p + ' : ' + xinspect(t, tabs + 1);
        } else {
            s += format_tabs(tabs);
            s += p + ' : ' + t ;
        }
        cnt += 1;
    }

    s += '\n';
    s += format_tabs(tabs);
    s += '}';
    return s;
};

console.log(xinspect(console,0));
