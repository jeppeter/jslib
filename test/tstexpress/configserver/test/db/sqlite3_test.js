var sqlite3 = require('sqlite3');
var util = require('util');
var argv = require('yargs')
    .help('h')
    .string('sql')
    .alias('sql', 'S')
    .default('S', 'select * from user;')
    .string('database')
    .alias('database', 'D')
    .default('D', 'test.db')
    .alias('h', 'help')
    .count('verbose')
    .alias('verbose', 'v')
    .usage(util.format('Usage %s [OPTIONS] sql', process.argv[1]))
    .argv;

/*    .string('select')
    .alias('select', 'S')
    .string('insert')
    .alias('insert', 'I')
    .string('create')
    .alias('create', 'C')
    .string('update')
    .alias('update', 'U')
*/

var databasename = argv.D;
var sqldb = new sqlite3.Database(databasename, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (err) {
    'use strict';
    if (err) {
        console.log('can not open %s error(%s)', databasename, JSON.stringify(err));
        process.exit(3);
    }
});

if (argv.verbose > 0) {
    sqlite3.verbose();
}

sqldb.all(argv.S, function (err, rows) {
    'use strict';
    if (err) {
        console.error('run(%s) error(%s)', argv.S, err);
    } else {
        console.log(util.inspect(rows, {
            showHidden: true,
            depth: null
        }));
    }
});