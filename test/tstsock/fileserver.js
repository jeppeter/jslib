var directory = __dirname;
var lport = 9000;

if (process.argv.length > 2) {
    directory = process.argv[2];
}

if (process.argv.length > 3) {
    lport = process.argv[3];
}

var connect = require('connect');

connect()
    .use(connect.static(directory)).listen(lport);

console.log('bind %d dir %s', lport, directory);