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

test('A003', function (t) {
    'use strict';
    var loads = `{"verbose|v" : "+","port|p" : 3000,"dep" : {"list|l" : [],"string|s" : "s_var","$" : "+"},"rdep" : {              "list|L" : [],"string|S" : "s_rdep","$" : 2}}`;
    var parser, args;
    parser = extargsparse.ExtArgsParse();
    parser.load_command_line_string(loads);
    args = parser.parse_command_line(['-vvvv', '-p', '5000', 'rdep', '-L', 'arg1', '--rdep-list', 'arg2', 'cc', 'dd']);
    t.equal(args.verbose, 4, get_notice(t, 'verbose'));
    t.equal(args.port, 5000, get_notice(t, 'port'));
    t.equal(args.subcommand, 'rdep', get_notice(t, 'subcommand'));
    t.deepEqual(args.rdep_list, ['arg1', 'arg2'], get_notice(t, 'rdep_list'));
    t.equal(args.rdep_string, 's_rdep', get_notice(t, 'rdep_string'));
    t.deepEqual(args.subnargs, ['cc', 'dd'], get_notice(t, 'subnargs'));
    t.end();
});

test('A004', function (t) {
    'use strict';
    var loads = `{"verbose|v" : "+","port|p" : 3000, "dep" : { "list|l" : [], "string|s" : "s_var","$" : "+"},"rdep" : {"list|L" : [], "string|S" : "s_rdep", "$" : 2}}`;
    var parser, args;
    parser = extargsparse.ExtArgsParse();
    parser.load_command_line_string(loads);
    args = parser.parse_command_line(['-vvvv', '-p', '5000', 'rdep', '-L', 'arg1', '--rdep-list', 'arg2', 'cc', 'dd']);
    t.equal(args.verbose, 4, get_notice(t, 'verbose'));
    t.equal(args.port, 5000, get_notice(t, 'port'));
    t.equal(args.subcommand, 'rdep', get_notice(t, 'subcommand'));
    t.deepEqual(args.rdep_list, ['arg1', 'arg2'], get_notice(t, 'rdep_list'));
    t.equal(args.rdep_string, 's_rdep', get_notice(t, 'rdep_string'));
    t.deepEqual(args.subnargs, ['cc', 'dd'], get_notice(t, 'subnargs'));
    t.end();
});

var call_args_function = function (args) {
    'use strict';
    var context = this;
    context.has_called_args = args.subcommand;
    return;
};
exports.call_args_function = call_args_function;

test('A005', function (t) {
    'use strict';
    var context = {};
    var loads = `{"verbose|v" : "+","port|p" : 3000,"dep<call_args_function>" : {"list|l" : [],"string|s" : "s_var","$" : "+"},"rdep" : {"list|L" : [],"string|S" : "s_rdep","$" : 2}}`;
    var parser, args;
    parser = extargsparse.ExtArgsParse();
    parser.load_command_line_string(loads);
    args = parser.parse_command_line(['-p', '7003', '-vvvvv', 'dep', '-l', 'foo1', '-s', 'new_var', 'zz'], context);
    t.equal(args.port, 7003, get_notice(t, 'port'));
    t.equal(args.verbose, 5, get_notice(t, 'verbose'));
    t.deepEqual(args.dep_list, ['foo1'], get_notice(t, 'dep_list'));
    t.equal(args.dep_string, 'new_var', get_notice(t, 'dep_string'));
    t.deepEqual(args.subnargs, ['zz'], get_notice(t, 'subnargs'));
    t.equal(context.has_called_args, 'dep', get_notice(t, 'has_called_args'));
    t.end();
});

test('A006', function (t) {
    'use strict';
    var loads1 = `{"verbose|v" : "+","port|p" : 3000,"dep" : {"list|l" : [],"string|s" : "s_var","$" : "+"}}`;
    var loads2 = `{"rdep" : {"list|L" : [],"string|S" : "s_rdep","$" : 2}}`;
    var parser, args;
    parser = extargsparse.ExtArgsParse();
    parser.load_command_line_string(loads1);
    parser.load_command_line_string(loads2);
    args = parser.parse_command_line(['-p', '7003', '-vvvvv', 'rdep', '-L', 'foo1', '-S', 'new_var', 'zz', '64']);
    t.equal(args.port, 7003, get_notice(t, 'port'));
    t.equal(args.verbose, 5, get_notice(t, 'verbose'));
    t.deepEqual(args.rdep_list, ['foo1'], get_notice(t, 'rdep_list'));
    t.equal(args.rdep_string, 'new_var', get_notice(t, 'rdep_string'));
    t.deepEqual(args.subnargs, ['zz', '64'], get_notice(t, 'subnargs'));
    t.end();
});