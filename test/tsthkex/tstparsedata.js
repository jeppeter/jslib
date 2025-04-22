var get_year_value = function (s) {
    'use strict';
    var sarr;
    var carr;
    sarr = s.split(' ');
    carr = sarr[0].split('/');
    if (carr.length >= 2) {
        return carr[2];
    }
    return undefined;

};

var val = get_year_value(process.argv[2]);
console.log('val %s', val);