
var fs = require('fs');

var parse_json = function (data) {
    'use strict';
    var cc = eval(data);
    var rdict = JSON.parse(cc);
    if (rdict.result !== undefined) {
        rdict.result = JSON.parse(rdict.result);
    }
    var outs = JSON.stringify(rdict, null, 4);
    return outs;
};

fs.readFile(process.argv[2], function (err, data) {
    'use strict';
    err = err;
    var outs = parse_json(data);
    console.log('%s', outs);
});