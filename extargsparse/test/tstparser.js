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