var commander = require('commander');
var tracelog = require('../../tracelog');
var util = require('util');
commander.subname = '';
commander.subopt = {};
commander.subargs = [];

var init_tracelog = function (opt) {
    'use strict';
    var logopt = {};
    var options = opt.parent;
    if (false) {
        console.log('(%s)', util.inspect(options, {
            showHidden: true,
            depth: 3
        }));
    }
    if (options.verbose >= 4) {
        logopt.level = 'trace';
    } else if (options.verbose >= 3) {
        logopt.level = 'debug';
    } else if (options.verbose >= 2) {
        logopt.level = 'info';
    } else if (options.verbose >= 1) {
        logopt.level = 'warn';
    } else {
        logopt.level = 'error';
    }

    if (options.logappends !== null && options.logappends !== undefined && options.logappends.length > 0) {
        logopt.appendfiles = options.logappends;
    }

    if (options.logfiles !== null && options.logfiles !== undefined && options.logfiles.length >= 0) {
        logopt.files = options.logfiles;
    }

    if (options.lognoconsole !== null && options.lognoconsole !== undefined && options.lognoconsole) {
        logopt.noconsole = true;
    }
    console.log('logopt (%s)', util.inspect(logopt, {
        showHidden: true,
        depth: null
    }));
    tracelog.Init(logopt);
    return;
};

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
    .version('0.2.0')
    .option('--logappends <appends>', 'log append files', function (v, t) {
        'use strict';
        t.push(v);
        return t;
    }, [])
    .option('--logfiles <files>', 'log files truncated', function (v, t) {
        'use strict';
        t.push(v);
        return t;
    }, [])
    .option('--lognoconsole', 'set no console for output as log', function (v, t) {
        'use strict';
        v = v;
        t = t;
        return true;
    }, false)
    .option('-v --verbose', 'verbose mode', function (v, t) {
        'use strict';
        v = v;
        return t + 1;
    }, 0);

commander
    .command('match [restr] [instr]')
    .action(function (restr, instr, options) {
        'use strict';
        var reg;
        commander.subname = 'match';
        init_tracelog(options);
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
        init_tracelog(options);
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
        init_tracelog(options);
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
        init_tracelog(options);
        tracelog.info('args %s %s', restr, instr);

        reg = new RegExp(restr);
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