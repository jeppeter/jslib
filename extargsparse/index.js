var keyparse = require('./keyparse');
var util = require('util');

function NewExtArgsParse(opt) {
    'use strict';
    var parser = {};
    var self;

    parser.flags = [];
    parser.help_func = null;
    parser.subparsers = [];
    parser.error = 0;
    if (process.argv > 1) {
        parser.cmdname = process.argv[1];
    } else {
        parser.cmdname = process.argv[0];
    }
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

    if (typeof opt.help_func === 'function') {
        parser.help_func = opt.help_func;
    }

    if (typeof opt.cmdname === 'string') {
        parser.cmdname = opt.cmdname;
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

    self.subcommand_flag_maxlen = function (curparser) {
        var maxlen = 0;
        var curlen;
        var shortopt = null;
        var longopt;
        curparser.flags.forEach(function (elm) {
            if (elm.flagname !== '$') {
                shortopt = elm.shortopt;
                longopt = elm.longopt;
                curlen = 0;
                if (shortopt !== null) {
                    curlen += shortopt.length;
                    /*for , to do*/
                    curlen += 1;
                }

                curlen += longopt.length;

                if (curlen > maxlen) {
                    maxlen = curlen;
                }
            }
        });
        return maxlen;
    };

    self.subcommand_maxlen = function () {
        var maxlen = 0;

        self.subparsers.forEach(function (elm) {
            if (elm.cmdname.length > maxlen) {
                maxlen = elm.cmdname.length;
            }
        });
        return maxlen;
    };

    self.flag_maxlen = function () {
        var maxlen = 0;
        var curlen;
        var shortopt, longopt, optdest;
        self.flags.forEach(function (elm) {
            if (elm.flagname !== '$') {
                shortopt = elm.shortopt;
                longopt = elm.longopt;
                optdest = elm.optdest;
                curlen = 0;
                if (shortopt !== null) {
                    curlen += shortopt.length;
                    /*this is for ,*/
                    curlen += 1;
                }

                curlen += longopt.length;
                /*for space*/
                curlen += 2;
                curlen += optdest.length;

                if (curlen > maxlen) {
                    maxlen = curlen;
                }

            }
        });

        return maxlen;
    };

    self.get_help_info = function (tabs, maxsize, keycls) {
        var s;
        var optdest;
        var longopt, shortopt;
        var idx;
        s = '';
        for (idx = 0; idx < tabs; idx += 1) {
            s += '  ';
        }

        optdest = keycls.optdest;
        shortopt = keycls.shortopt;
        longopt = keycls.longopt;

        if (shortopt !== null) {
            s += shortopt;
            s += ',';
        }
        s += longopt;
        s += '  ';
        s += optdest.toUpperCase();

        while (s.length < maxsize) {
            s += ' ';
        }

        if (keycls.helpinfo) {
            s += keycls.helpinfo;
            s += '\n';
        } else {
            if (keycls.typename === 'string' || keycls.typename === 'int' || keycls.typename === 'float') {
                s += util.format('set %s default(%s)\n', optdest.toLowerCase(), keycls.value);
            } else if (keycls.typename === 'count') {
                s += util.format('set %s count increment default(%d)\n', optdest.toLowerCase(), keycls.value);
            } else if (keycls.typename === 'array') {
                s += util.format('set %s list default(%s)\n', optdest.toLowerCase(), keycls.value);
            }
        }
        return s;
    };

    self.main_help = function (maxsize) {
        var subnargskeycls;
        var s;

        subnargskeycls = null;

        self.flags.forEach(function (elm) {
            if (elm.flagname === '$') {
                subnargskeycls = elm;
            }
        });

        s = '';
        s += self.cmdname;
        s += ' ';
        if (subnargskeycls === null) {
            s += '[OPTIONS] ';
            if (self.subparsers.length > 0) {
                s += '{subcommand} ';
            }
            s += '\n';
        } else {
            if (subnargskeycls.helpinfo) {
                s += subnargskeycls.helpinfo;
                s += '\n';
            } else {
                if (subnargskeycls.value === '?') {
                    s += util.format('[subnargs]\n');
                } else if (subnargskeycls.value === '*' || subnargskeycls.value === '+') {
                    s += util.format('[subnargs]...\n');
                } else {
                    s += util.format(' %s arguments\n', subnargskeycls.value);
                }
            }
        }

        self.flags.forEach(function (elm) {
            if (elm.flagname !== '$') {
                s += self.get_help_info(1, maxsize, elm);
            }
        });

        return s;
    };


    self.subcommand_help = function (maxsize, curparser) {
        var s;
        var keycls;
        var subnargskeycls;
        if (curparser === null) {
            return self.main_help(maxsize);
        }

        keycls = curparser.keycls;
        s = '';
        s += util.format('%s ', keycls.cmdname);
        subnargskeycls = null;

        curparser.flags.forEach(function (elm) {
            if (elm.flagname === '$') {
                subnargskeycls = elm;
            }
        });

        if (keycls.helpinfo === null) {
            if (subnargskeycls !== null && subnargskeycls.helpinfo !== null) {
                s += subnargskeycls.helpinfo;
            } else {
                if (subnargskeycls !== null) {
                    if (subnargskeycls.value === '?') {
                        s += '[subnargs]';
                    } else if (subnargskeycls.value === '*' || subnargskeycls.value === '+') {
                        s += '[subnargs]...';
                    } else {
                        s += util.format('%d args', subnargskeycls.value);
                    }
                }
            }
            s += '\n';
        } else {
            s += util.format('%s\n', keycls.helpinfo);
        }

        curparser.flags.forEach(function (elm) {
            if (elm.flagname !== '$') {
                s += self.get_help_info(1, maxsize, elm);
            }
        });

        return s;
    };


    self.print_help = function (ec, fmt) {
        var s;
        var maxlen;
        var fp;
        s = '';

        maxlen = self.flag_maxlen();

        if (fmt !== undefined && fmt !== null) {
            s += fmt;
            s += '\n';
        }
        s += self.main_help(maxlen);
        if (self.help_func !== null) {
            self.help_func(s);
        } else {
            if (ec === 0) {
                fp = process.stdout;
            } else {
                fp = process.stderr;
            }
            fp.write(s);
            process.exit(ec);
        }
        return;
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

    self.handle_args_value = function (args, nextarg, keycls) {
        var destname = keycls.optdest.toLowerCase();
        var errstr;
        if (keycls.typename === 'boolean') {
            if (keycls.value) {
                args[destname] = false;
            } else {
                args[destname] = true;
            }
        } else if (keycls.typename === 'count') {
            if (args[destname] === undefined) {
                args[destname] = 1;
            } else {
                args[destname] += 1;
            }
        } else if (keycls.typename === 'float') {
            args[destname] = parseFloat(nextarg);
        } else if (keycls.typename === 'int') {
            args[destname] = parseInt(nextarg);
        } else if (keycls.typename === 'array') {
            if (args[destname] === undefined) {
                args[destname] = [];
            }
            args[destname].push(nextarg);
        } else if (keycls.typename === 'string') {
            args[destname] = nextarg;
        } else {
            errstr = util.format('unknown type (%s)', keycls.typename);
            throw new Error(errstr);
        }

        return args;
    };


    self.parse_shortopt = function (arg, nextarg, curparser) {
        var skip = 0;
        var i, j;
        var keycls;
        var shortopt;
        if (curparser) {
            for (i = 1; i < arg.length; i += 1) {
                keycls = null;
                for (j = 0; j < curparser.flags.length; j += 1) {
                    if (curparser.flags[j].flagname !== '$') {
                        shortopt = curparser.flags[j].shortopt;
                        if (shortopt !== null) {
                            if (shortopt[1] === arg[i]) {
                                keycls = curparser.flags[j];
                                break;
                            }
                        }
                    }
                }
                if (keycls === null) {
                    return -1;
                }

                if (keycls.typename === 'count' || keycls.typename === 'boolean') {
                    self.args = self.handle_args_value(self.args, null, keycls);
                } else {
                    if (arg !== keycls.shortopt) {
                        return -1;
                    }
                    self.args = self.handle_args_value(self.args, nextarg, keycls);
                    skip += 1;
                }
            }
        } else {
            for (i = 1; i < arg.length; i += 1) {
                keycls = null;
                for (j = 0; j < self.flags; j += 1) {
                    if (self.flags[j].flagname !== '$') {
                        shortopt = self.flags[j].shortopt;
                        if (shortopt && shortopt[1] === arg[i]) {
                            keycls = self.flags[j];
                            break;
                        }
                    }
                }
                if (keycls === null) {
                    return -1;
                }

                if (keycls.typename === 'count' || keycls.typename === 'boolean') {
                    self.args = self.handle_args_value(self.args, null, keycls);
                } else {
                    if (keycls.shortopt !== arg) {
                        return -1;
                    }
                    self.args = self.handle_args_value(self.args, nextarg, keycls);
                    skip += 1;
                }
            }
        }

        return skip;
    };

    self.parse_command_line_inner = function (arglist) {
        var i, j;
        var curparser = null;
        var args;
        var curarg;
        var leftargs = [];
        var added = 0;
        var nextarg;
        args = {};
        for (i = 0; i < arglist.length; i += 1) {
            curarg = arglist[i];
            nextarg = null;
            if ((i + 1) < arglist.length) {
                nextarg = arglist[(i + 1)];
            }
            if (curarg === '--') {
                for (j = (i + 1); j < arglist.length; j += 1) {
                    leftargs.push(arglist[j]);
                }
                break;
            } else if (curarg.length > 2 && curarg[0] === '-' && curarg[1] === '-') {

            } else if (curarg.length >= 2 && curarg[0] === '-' && curarg[1] !== '-') {
                added = self.parse_shortopt(curarg, nextarg, curparser);
                if (added < 0) {}
            } else {
                if (curparser === null) {
                    if (self.subparsers.length === 0) {
                        for (j = i; j < arglist.length; i += 1) {
                            leftargs.push(arglist[i]);
                        }
                        break;
                    }

                    for (j = 0; j < self.subparsers.length; j += 1) {
                        if (self.subparsers[j].cmdname === curarg) {
                            curparser = self.subparsers[j];
                            break;
                        }
                    }

                    if (curparser === null) {
                        self.print_help(3, util.format('can not find (%s) as subcommand', curarg));
                        self.error = 3;
                        return args;
                    }
                }
            }
        }
    };

    self.parse_command_line(arraylist, context) {
        var args;
        var arglist = [];
        var i;

        if (arraylist === null || arraylist === undefined) {
            for (i = 2; i < process.argv.length; i += 1) {
                arglist.push(process.argv[i]);
            }
        } else {
            arglist = arraylist;
        }

        args = self.parse_command_line_inner(arraylist);

        return args;
    };
    return parser;
}

module.exports.ExtArgsParse = NewExtArgsParse;