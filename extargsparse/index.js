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