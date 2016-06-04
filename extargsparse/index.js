var keyparse = require('./keyparse');
var util = require('util');

function NewExtArgsParse(opt) {
    'use strict';
    var parser = {};
    var self;

    parser.flags = [];
    parser.subparsers = [];
    self = parser;
    parser.mapfuncs = {
        args: self.load_command_line_args,
        boolean: self.load_command_line_boolean,
        array: self.load_command_line_array,
        float: self.load_command_line_float,
        int: self.load_command_line_int,
        string: self.load_command_line_string,
        command: self.load_command_line_command,
        prefix: self.load_command_line_prefix,
        count: self.load_command_line_count
    };

    parser.priority = [];
    if (opt.priority !== undefined && opt.priority !== null) {
        parser.priority = opt.priority;
    }

    self.check_flag_insert = function (keycls, curparser) {
        var idx;
        var curflag;
        if (curparser) {
            for (idx = 0; idx < curparser.flags.length; idx += 1) {
                curflag = curparser.flags[idx];
                if (curflag.flagname !== '$' && keycls.flagname !== '$') {
                    if (curflag.optdest === keycls.optdest) {
                        return false;
                    }
                } else if (curflag.flagname === keycls.flagname) {
                    return false;
                }
            }
            curparser.flags.push(keycls);
        } else {
            for (idx = 0; idx < self.flags.length; idx += 1) {
                curflag = self.flags[idx];
                if (curflag.flagname !== '$' && keycls.flagname !== '$') {
                    if (curflag.optdest === keycls.optdest) {
                        return false;
                    }
                } else if (curflag.flagname === keycls.flagname) {
                    return false;
                }
            }
            self.flags.push(keycls);
        }
        return true;
    };

    self.check_flag_insert_mustsucc = function (keycls, curparser) {
        var inserted;
        var errstr;

        inserted = self.check_flag_insert(keycls, curparser);
        if (!inserted) {
            errstr = util.format('(%s) has inserted', keycls.optdest);
            throw new Error(errstr);
        }
        return inserted;
    };
    self.load_command_line_args = function (prefix, keycls, curparser) {
        prefix = prefix;
        return self.check_flag_insert(keycls, curparser);
    };
    self.load_command_line_boolean = function (prefix, keycls, curparser) {
        prefix = prefix;
        return self.check_flag_insert_mustsucc(keycls, curparser);
    };

    self.load_command_line_array = function (prefix, keycls, curparser) {
        prefix = prefix;
        return self.check_flag_insert_mustsucc(keycls, curparser);
    };

    self.load_command_line_float = function (prefix, keycls, curparser) {
        prefix = prefix;
        return self.check_flag_insert_mustsucc(keycls, curparser);
    };

    self.load_command_line_int = function (prefix, keycls, curparser) {
        prefix = prefix;
        return self.check_flag_insert_mustsucc(keycls, curparser);
    };
    self.load_command_line_string = function (prefix, keycls, curparser) {
        prefix = prefix;
        return self.check_flag_insert_mustsucc(keycls, curparser);
    };

    self.get_subparser_inner = function (keycls) {
        var idx;
        var cursubparser;
        for (idx = 0; idx < self.subparsers.length; idx += 1) {
            cursubparser = self.subparsers[idx];
            if (keycls.cmdname === cursubparser.cmdname) {
                return cursubparser;
            }
        }

        cursubparser = {};
        cursubparser.flags = [];
        cursubparser.cmdname = keycls.cmdname;
        cursubparser.keycls = keycls;
        self.subparsers.push(cursubparser);
        return cursubparser;
    };

    self.load_command_line_command = function (prefix, keycls, curparser) {
        var errstr;
        if (curparser) {
            errstr = util.format('can not make (%s) in another subcommand (%s)', keycls.command, curparser.cmdname);
            throw new Error(errstr);
        }
        if (keycls.typename !== 'Object') {
            errstr = util.format('(%s) not  object value', keycls.cmdname);
            throw new Error(errstr);
        }

        prefix = prefix;
        curparser = self.get_subparser_inner(keycls);
        self.load_command_line_inner(keycls.cmdname, keycls.value, curparser);
        return true;
    };

    self.load_command_line_prefix = function (prefix, keycls, curparser) {
        var errstr;

        if (typeof keycls.value !== 'object') {
            errstr = util.format('(%s) not object value', keycls.prefix);
            throw new Error(errstr);
        }
        prefix = prefix;
        self.load_command_line_inner(keycls.prefix, keycls.value, curparser);
        return true;
    };

    self.load_command_line_count = function (prefix, keycls, curparser) {
        prefix = prefix;
        return self.check_flag_insert_mustsucc(keycls, curparser);
    };


    self.load_command_line_inner = function (prefix, opt, curparser) {
        var keys;
        var curkey, curval;
        var idx;
        var keycls;
        var valid;
        var errstr;
        keys = Object.keys(opt);
        for (idx = 0; idx < keys.length; idx += 1) {
            curkey = keys[idx];
            curval = opt[curkey];
            if (curparser !== null) {
                keycls = keyparse.KeyParser(prefix, curkey, curval, true);
            } else {
                keycls = keyparse.KeyParser(prefix, curkey, curval, false);
            }
            valid = self.mapfuncs[keycls.typename](prefix, keycls, curparser);
            if (!valid) {
                errstr = util.format('(%s) (%s) not parse ok', curkey, curval);
                throw new Error(errstr);
            }
        }
        return self;
    };
    self.load_command_line = function (cmdopt) {
        return self.load_command_line_inner('', cmdopt, null);
    };

    self.set_command_line_self_args = function () {
        var curkey;
        self.subparsers.forEach(function (elm) {
            curkey = keyparse.KeyParser(elm.cmdname, '$', '*', true);
            self.load_command_line_args(elm.cmdname, curkey, elm);
        });
        curkey = keyparse.KeyParser('', '$', '*', true);
        self.load_command_line_args('', curkey, null);
        return;
    };


    self.load_command_line_string = function (cmdstr) {
        var cmdopt;
        try {
            cmdopt = JSON.parse(cmdstr);
        } catch (e) {
            throw new Error('can not parse (%s) (%s)', cmdstr, JSON.stringify(e));
        }
        return self.load_command_line(cmdopt);
    };
    return parser;
}

module.exports.ExtArgsParse = NewExtArgsParse;