var path = require('path');
var curdir = '.';
var absdir;

if (process.argv.length > 2) {
    curdir = process.argv[2];
}

absdir = path.resolve(curdir, '.');
console.log('%s abs %s', curdir, absdir);