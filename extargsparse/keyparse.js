var util = require('util');

var set_words_access = function (words, self) {
    'use strict';
    words.forEach(function (elm) {
        Object.defineProperty(self, elm, {
            enumerable: true,
            get: function () {
                return self.get_word(elm);
            },
            set: function (v) {
                var errstr;
                v = v;
                errstr = util.format('can not set (%s)', elm);
                throw new Error(errstr);
            }
        });
    });
    return;
};

var get_value_type = function (value) {
    'use strict';
    var typestr = 'unknown';
};

function CreateKeyParse(prefix, key, value, iskey) {
    'use strict';
    var dict;
    var self;
    var flagspecial = ['value', 'prefix'];
    var flagwords = ['flagname', 'helpinfo', 'shortflag', 'nargs'];
    var cmdwords = ['cmdname', 'function', 'helpinfo'];
    var otherwords = ['origkey', 'iscmd', 'isflag', 'type'];
    var formwords = ['longopt', 'shortopt', 'optdest'];
    dict = {};
    self = {};

    self.helpexpr = new RegExp('##([^#]+)##$', 'i');
    self.cmdexpr = new RegExp('^([^\\#\\<\\>\\+\\$]+)', 'i');

    self.form_words = function (elm) {
        var errstr;
        var retstr = '';
        if (elm === 'longopt') {
            if (!dict.isflag || !dict.flagname || dict.type === 'args') {
                errstr = util.format('can not set (%s) longopt', dict.origkey);
                throw new Error(errstr);
            }
            retstr += '--';
            if (dict.prefix.length > 0) {
                retstr += util.format('%s_', dict.prefix);
            }
            retstr += dict.flagname;
            retstr = retstr.toLowerCase();
            retstr = retstr.replace(/_/g, '-');
            return retstr;
        }
        if (elm === 'shortopt') {
            if (!dict.isflag || !dict.flagname || dict.type === 'args') {
                errstr = util.format('can not set (%s) shortopt', dict.origkey);
                throw new Error(errstr);
            }
            if (!dict.shortflag) {
                return null;
            }
            retstr += '-';
            retstr += dict.shortflag;
            return retstr;
        }
        if (elm === 'optdest') {
            if (!dict.isflag || !dict.flagname || dict.type === 'args') {
                errstr = util.format('can not set (%s) shortopt', dict.origkey);
                throw new Error(errstr);
            }
            if (dict.prefix.length > 0) {
                retstr += util.format('%s_', dict.prefix);
            }

            retstr += dict.flagname;
            retstr = retstr.toLowerCase();
            retstr = retstr.replace(/-/g, '_');
            return retstr;
        }
        errstr = util.format('unknown word (%s)', elm);
        throw new Error(errstr);
    };

    self.get_word = function (elm) {
        var errstr;
        if (flagspecial.indexOf(elm) >= 0 || flagwords.indexOf(elm) >= 0 || cmdwords.indexOf(elm) >= 0) {
            return dict[elm];
        }

        if (formwords.indexOf(elm) >= 0) {
            return self.form_words(elm);
        }

        errstr = util.format('unknown %s ', elm);
        throw new Error(errstr);
    };

    set_words_access(flagwords, self);
    set_words_access(otherwords, self);
    set_words_access(cmdwords, self);
    set_words_access(formwords, self);

    self.reset_value = function () {
        dict.value = null;
        dict.prefix = '';
        dict.flagname = null;
        dict.helpinfo = null;
        dict.shortflag = null;
        dict.nargs = null;
        dict.cmdname = null;
        dict.function = null;
        dict.origkey = key;
        dict.isflag = false;
        dict.iscmd = false;
        dict.type = null;
        return;
    };

    self.validate = function () {

    };

    self.set_flag = function () {
        var errstr;
        var k, keys;
        var newprefix;
        dict.isflag = true;
        dict.iscmd = false;
        dict.origkey = key;
        if (typeof value !== 'object') {
            errstr = util.format('(%s) not dict type value', self.origkey);
            throw new Error(errstr);
        }

        if (value.value === undefined) {
            dict.value = null;
            dict.type = 'string';
        }

        keys = Object.keys(value);
        for (k in keys) {
            if (flagwords.indexOf(k) >= 0) {
                if (dict[k] !== null && dict[k] !== value[k]) {
                    errstr = util.format('(%s) key(%s) not set equal', dict.origkey, k);
                    throw new Error(errstr);
                }

                if (!(typeof value[k] === 'number' || typeof value[k] === 'string')) {
                    errstr = util.format('(%s) key(%s) not string or number', dict.origkey, k);
                    throw new Error(errstr);
                }
                dict[k] = value[k];
            } else if (flagspecial.indexOf(k) >= 0) {
                if (k === 'prefix') {
                    if (typeof value.prefix !== 'string' || value.prefix === null) {
                        errstr = util.format('(%s) prefix can not valid', dict.origkey);
                        throw new Error(errstr);
                    }
                    newprefix = '';
                    if (prefix.length > 0) {
                        newprefix += util.format('%s_', prefix);
                    }
                    newprefix += value.prefix;
                    dict.prefix = newprefix;
                } else if (k === 'value') {
                    if (typeof value.value === 'object') {
                        errstr = util.format('(%s) value is object', dict.origkey);
                        throw new Error(errstr);
                    }
                    dict.value = value.value;

                }
            }
        }
    };

    self.init_fn = function () {
        self.reset_value();
    };

    return self;
}

module.exports = CreateKeyParse;