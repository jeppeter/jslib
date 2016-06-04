var extargsparse = require('../');
var test = require('tape');
var tracelog = require('../../tracelog');
var util = require('util');
tracelog.Init({
    level: 'trace'
});

var get_notice = function (t, name) {
    'use strict';
    return util.format('%s %s', t.name, name);
};

test('A001', function (t) {
    'use strict';
    var loads = `{ "verbose|v##increment verbose mode##": "+","flag|f## flag set##": false, "number|n": 0,"list|l": [],"string|s": "string_var","$": {"value": [],"nargs": "*","typename": "string"}}`;
    var parser;
    var args;
    parser = extargsparse.ExtArgsParse();
    parser.load_command_line_string(loads);
    args = parser.parse_command_line(['-vvvv', '-f', '-n', '30', '-l', 'bar1', '-l', 'bar2', 'var1', 'var2']);
    t.equal(args.verbose, 4, get_notice(t, 'verbose'));
    t.equal(args.flag, true, get_notice(t, 'flag'));
    t.equal(args.number, 30, get_notice(t, 'number'));
    t.deepEqual(args.list, ['bar1', 'bar2'], get_notice(t, 'list'));
    t.equal(args.string, 'string_var', get_notice(t, 'string'));
    t.deepEqual(args.args, ['var1', 'var2'], get_notice(t, 'args'));
    t.end();
});

test('A002', function (t) {
    'use stirct';
    var loads = `{"verbose|v" : "+","port|p" : 3000,"dep" : {"list|l" : [],"string|s" : "s_var","$" : "+"}}`;
    var parser, args;
    parser = extargsparse.ExtArgsParse();
    parser.load_command_line_string(loads);
    args = parser.parse_command_line(['-vvvv', '-p', '5000', 'dep', '-l', 'arg1', '--dep-list', 'arg2', 'cc', 'dd']);
    t.equal(args.verbose, 4, get_notice(t, 'verbose'));
    t.equal(args.port, 5000, get_notice(t, 'port'));
    t.equal(args.subcommand, 'dep', get_notice(t, 'subcommand'));
    t.deepEqual(args.dep_list, ['arg1', 'arg2'], get_notice(t, 'dep_list'));
    t.equal(args.dep_string, 's_var', get_notice(t, 'dep_string'));
    t.deepEqual(args.subnargs, ['cc', 'dd'], get_notice(t, 'subnargs'));
    t.end();
});