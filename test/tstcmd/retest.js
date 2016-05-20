var commander = require('commander');
var tracelog = require('../../tracelog');
//var util = require('util');
commander.subname = '';
commander.subopt = {};
commander.subargs = [];


var trace_exit = function (ec) {
    'use strict';
    tracelog.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};


commander
    .version('0.2.0');

tracelog.init_commander(commander);

commander
    .command('match [restr] [instr]')
    .action(function (restr, instr, options) {
        'use strict';
        var reg;
        commander.subname = 'match';
        tracelog.set_commander(options.parent);
        tracelog.info('restr (%s) instr (%s)', restr, instr);

        reg = new RegExp(restr);
        if (reg.test(instr)) {
            console.log('%s match (%s)', instr, restr);
        } else {
            console.log('%s not match (%s)', instr, restr);
        }
        trace_exit(0);
    });

commander
    .command('imatch [restr] [instr]')
    .action(function (restr, instr, options) {
        'use strict';
        var reg;
        commander.subname = 'match';
        tracelog.set_commander(options.parent);
        tracelog.info('restr (%s) instr (%s)', restr, instr);

        reg = new RegExp(restr, 'i');
        if (reg.test(instr)) {
            console.log('%s match (%s)', instr, restr);
        } else {
            console.log('%s not match (%s)', instr, restr);
        }
        trace_exit(0);
    });

commander
    .command('find [restr] [instr]')
    .action(function (restr, instr, options) {
        'use strict';
        var reg;
        var m;
        commander.subname = 'ifind';
        tracelog.set_commander(options.parent);
        tracelog.info('args %s %s', restr, instr);

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
    });

commander
    .command('ifind [restr] [instr]')
    .action(function (restr, instr, options) {
        'use strict';
        var reg;
        var m;
        commander.subname = 'ifind';
        tracelog.set_commander(options.options);
        tracelog.info('args %s %s', restr, instr);

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
    });


commander.parse(process.argv);

if (commander.subname.length === 0) {
    commander.outputHelp(function (cb) {
        'use strict';
        var s;
        s = 'please specified sub command\n';
        s += cb;
        return cb;
    });
    process.exit(3);
}