var connect = require('connect');
var directory = '.';
var lport = 9000;

if (process.argv.length > 2) {
    directory = process.argv[2];
}

if (process.argv.length > 3) {
    lport = process.argv[3];
}

connect.use(connect.static(directory)).listen(lport);
console.log('listen on %d', lport);