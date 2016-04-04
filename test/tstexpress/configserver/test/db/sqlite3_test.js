var sqlite3 = require('sqlite3');
var util = require('util');
var argv = require('yargs')
    .demand(1)
    .help('h')
    .string('create')
    .alise('create', 'C')
    .default('C', 'user')
    .alias('h', 'help')
    .count('verbose')
    .alias('verbose', 'v')
    .usage(util.format('Usage %s [OPTIONS] file', process.argv[1]))
    .argv;

var databasename = argv._[0];
var sqldb = sqlite3.DataBase(databasename, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (err) {
    'use strict';
    if (err) {
        console.log('can not open %s error(%s)', databasename, JSON.stringify(err));
        process.exit(3);
    }
});
if (argv.C) {

}