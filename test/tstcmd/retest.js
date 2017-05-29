var jstracer = require('jstracer');
var extargsparse = require('extargsparse');
var parser = extargsparse.ExtArgsParse();
//var util = require('util');
var command_line = `
    {
        "match<re_match>## restr instr call re.match ##" : {
            "$" : 2
        },
        "imatch<re_imatch>## restr instr call re.imatch ##" : {
            "$" : 2
        },
        "find<re_find>## restr instr call re.findall ##" : {
            "$" : 2
        },
        "ifind<re_ifind>## ifind restr instr call re.ifindall ##" : {
            "$" : 2
        }
    }
`;

var trace_exit = function (ec) {
    'use strict';
    jstracer.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};


parser.load_command_line_string(command_line);
jstracer.init_args(parser);

var re_match = function (args) {
    'use strict';
    var reg;
    var restr, instr;
    restr = args.subnargs[0];
    instr = args.subnargs[1];
    jstracer.set_args(args);
    jstracer.info('restr (%s) instr (%s)', restr, instr);

    reg = new RegExp(restr);
    if (reg.test(instr)) {
        console.log('%s match (%s)', instr, restr);
    } else {
        console.log('%s not match (%s)', instr, restr);
    }
    trace_exit(0);
};

exports.re_match = re_match;


var re_imatch = function (args) {
    'use strict';
    var reg;
    var restr, instr;
    restr = args.subnargs[0];
    instr = args.subnargs[1];
    jstracer.set_args(args);
    jstracer.info('restr (%s) instr (%s)', restr, instr);

    reg = new RegExp(restr, 'i');
    if (reg.test(instr)) {
        console.log('%s match (%s)', instr, restr);
    } else {
        console.log('%s not match (%s)', instr, restr);
    }
    trace_exit(0);
};

exports.re_imatch = re_imatch;

var re_find = function (args) {
    'use strict';
    var reg;
    var m;
    var restr, instr;
    restr = args.subnargs[0];
    instr = args.subnargs[1];
    jstracer.set_args(args);
    jstracer.info('args %s %s', restr, instr);

    reg = new RegExp(restr, 'i');
    m = reg.exec(instr);
    if (m !== null && m !== undefined) {
        console.log('%s find (%s)', instr, restr);
        m.forEach(function (elm, idx) {
            console.log('[%d] (%s)', idx, elm);
        });
    } else {
        console.log('%s not find (%s)', instr, restr);
    }
    trace_exit(0);
};
exports.re_find = re_find;

var re_ifind = function (args) {
    'use strict';
    var reg;
    var m;
    var restr, instr;
    restr = args.subnargs[0];
    instr = args.subnargs[1];
    jstracer.set_args(args);
    jstracer.info('args %s %s', restr, instr);

    reg = new RegExp(restr, 'i');
    m = reg.exec(instr);
    if (m !== null && m !== undefined) {
        console.log('(%s) ifind (%s)', instr, restr);
        m.forEach(function (elm, idx) {
            console.log('[%d] (%s)', idx, elm);
        });
    } else {
        console.log('(%s) not ifind (%s)', instr, restr);
    }
    trace_exit(0);
};

exports.re_ifind = re_ifind;



parser.parse_command_line();