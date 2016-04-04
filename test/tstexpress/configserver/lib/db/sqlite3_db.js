var sqlite3 = require('sqlite3');

function DataBase(options) {
    'use strict';
    var self;
    self = this;
    this.dbname = 'test.db';
    this.tbluser = 'user';
    this.tblblog = 'blog';
    this.tblfriend = 'friend';
    if (typeof (options.dbname) === 'string' && options.dbname.length > 0) {
        this.dbname = options.dbname;
    }

    return this;
}

module.exports.createdb = function (options) {
    'use strict';
    var init_options = options || {};
    return new DataBase(options);
};