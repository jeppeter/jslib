
var callback = function (args) {
    'use strict';
    var retval = undefined;
    if (args.stockInfo !== undefined) {
        var cval = args.stockInfo;
        if (cval.length === 1) {
            if (cval[0].stockId !== undefined) {
                retval = cval[0].stockId;
            }
        }
    }
    return retval;
};

console.log('argv1 %s', process.argv[2]);
var val = eval(process.argv[2]);
console.log('val %s', val);
