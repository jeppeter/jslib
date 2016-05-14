var commander = require('commander');
var tracelog = require('../../tracelog');
commander.subname = '';
commander.subopt = {};
commander.subargs = [];

var init_tracelog = function (options) {
    'use strict';
    var logopt = {};
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

    if (options.logfiles !== null && options.logfiles !== undefined && options.logfiles >= 0) {
        logopt.files = options.logfiles;
    }
    tracelog.Init(logopt);
    return;
};


commander
    .version('0.2.0')
    .option('-v --verbose', 'verbose mode', function (v, t) {
        'use strict';
        v = v;
        return t + 1;
    }, 0);

commander
    .command('match [str...]')
    .action(function (args, options) {
        'use strict';
        var reg;
        init_tracelog(options);
        options = options;
        if (args.length < 2) {
            process.stderr.write('need instr restr\n');
            process.exit(3);
        }

        reg = new RegExp(args[1]);
        if (reg.test(args[0])) {
            console.log('%s match (%s)', args[0], args[1]);
        } else {
            console.log('%s not match (%s)', args[0], args[1]);
        }
        process.exit(0);
    });

commander
    .command('imatch [str...]')
    .action(function (args, options) {
        'use strict';
        var reg;
        init_tracelog(options);
        if (args.length < 2) {
            process.stderr.write('need instr restr\n');
            process.exit(3);
        }

        reg = new RegExp(args[1], 'i');
        if (reg.test(args[0])) {
            console.log('%s match (%s)', args[0], args[1]);
        } else {
            console.log('%s not match (%s)', args[0], args[1]);
        }
        process.exit(0);

    });

commander
    .command('find [str...]')
    .action(function (args, options) {
        'use strict';
        var reg;
        var m;
        init_tracelog(options);
        if (args.length < 2) {
            process.stderr.write('need instr restr\n');
            process.exit(3);
        }

        reg = new RegExp(args[1]);
        m = reg.exec(args[0]);
        if (m !== null && m !== undefined) {
            console.log('%s find (%s)', args[0], args[1]);
            m.forEach(function (elm, idx) {
                console.log('[%d] (%s)', idx, elm);
            });
        } else {
            console.log('%s not find (%s)', args[0], args[1]);
        }
        process.exit(0);
    });

commander
    .command('ifind [str...]')
    .action(function (args, options) {
        'use strict';
        var reg;
        var m;
        init_tracelog(options);
        if (args.length < 2) {
            process.stderr.write('need instr restr\n');
            process.exit(3);
        }

        reg = new RegExp(args[1], 'i');
        m = reg.exec(args[0]);
        if (m !== null && m !== undefined) {
            console.log('%s find (%s)', args[0], args[1]);
            m.forEach(function (elm, idx) {
                console.log('[%d] (%s)', idx, elm);
            });
        } else {
            console.log('%s not find (%s)', args[0], args[1]);
        }
        process.exit(0);
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