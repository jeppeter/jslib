var sqlite3 = require('sqlite3');
var util = require('util');
var argv = require('yargs')
    .help('h')
    .string('sql')
    .aliase('sql', 'S')
    .default('S', 'select * from user')
    .string('database')
    .alise('database', 'D')
    .default('D', 'test.db')
    .alias('h', 'help')
    .count('verbose')
    .alias('verbose', 'v')
    .usage(util.format('Usage %s [OPTIONS] sql', process.argv[1]))
    .argv;

var databasename = argv.D;
var sqldb = sqlite3.DataBase(databasename, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (err) {
    'use strict';
    if (err) {
        console.log('can not open %s error(%s)', databasename, JSON.stringify(err));
        process.exit(3);
    }
});

if (argv.verbose > 0) {
    sqldb.verbose();
}

sqldb.run(argv.S, function (err) {
    'use strict';
    if (err) {
        console.error('run(%s) error(%s)', argv.S, err);
    } else {
        console.log('run %s succ', argv.S);
    }
});