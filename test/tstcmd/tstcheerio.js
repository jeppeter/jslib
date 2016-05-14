var cheerio = require('cheerio');
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
    console.log('logopt (%s)', util.inspect(logopt, {
        showHidden: true,
        depth: null
    }));
    tracelog.Init(logopt);
    return;
};

var trace_exit = function (next) {
    'use strict';
    tracelog.finish(function (err) {
        if (err) {
            return;
        }
        next();
    });
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
    .option('-s --selector <selector>', 'selector ', function (v, t) {
        'use strict';
        t = t;
        return v;
    }, '')
    .option('-v --verbose', 'verbose mode', function (v, t) {
        'use strict';
        v = v;
        return t + 1;
    }, 0);


commander
    .command('select <str>')
    .action(function (args, options) {
        'use strict';
        var parser;
        var content;
        init_tracelog(options);
        options = options;
        if (args.length < 1) {
            process.stderr.write('need instr restr\n');
            process.exit(3);
        }

        if (options.parent.selector.length === 0) {
            process.stderr.write('need selector set\n');
            process.exit(3);
        }

        tracelog.info('args %s', args);
        parser = cheerio.load(args[0]);
        tracelog.trace('parser (%s)', util.inspect(parser, {
            showHidden: true,
            depth: null
        }));
        content = parser(options.parent.selector);
        if (content === null || content === undefined) {
            console.log('can not find(%s) in (%s)', options.parent.selector, args[0]);
        } else {
            //console.log('<%s> (%s)', options.parent.selector, content.text());
            if (Array.isArray(content)) {
                content.forEach(function (elm, idx) {
                    console.log('<%s>[%d] (%s)', options.parent.selector, idx, elm.html());
                    tracelog.trace('<%s>[%d] (%s)', options.parent.selector, idx, util.inspect(elm, {
                        showHidden: true,
                        depth: null
                    }));
                });
            } else {
                console.log('<%s> (%s)', options.parent.selector, content.html());
                tracelog.trace('<%s> (%s)', options.parent.selector, util.inspect(content, {
                    showHidden: true,
                    depth: null
                }));
            }
        }

        commander.subname = 'selector';
        trace_exit(function () {
            process.exit(0);
        });
    });

commander
    .command('parent <str>')
    .action(function (args, options) {
        'use strict';
        var parser;
        var content;
        init_tracelog(options);
        options = options;
        if (args.length < 1) {
            process.stderr.write('need instr restr\n');
            process.exit(3);
        }

        if (options.parent.selector.length === 0) {
            process.stderr.write('need selector set\n');
            process.exit(3);
        }

        tracelog.info('args %s', args);
        parser = cheerio.load(args[0]);
        tracelog.trace('parser (%s)', util.inspect(parser, {
            showHidden: true,
            depth: null
        }));
        content = parser(options.parent.selector);
        if (content === null || content === undefined) {
            console.log('can not find(%s) in (%s)', options.parent.selector, args[0]);
        } else {
            if (Array.isArray(content)) {
                content.forEach(function (elm, idx) {
                    console.log('<%s>[%d] (%s)', options.parent.selector, idx, elm.parent().html());
                    tracelog.trace('<%s>[%d] (%s)', options.parent.selector, idx, util.inspect(elm.parent(), {
                        showHidden: true,
                        depth: null
                    }));
                });
            } else {
                console.log('<%s> (%s)', options.parent.selector, content.parent().html());
                tracelog.trace('<%s> (%s)', options.parent.selector, util.inspect(content.parent(), {
                    showHidden: true,
                    depth: null
                }));
            }
        }

        commander.subname = 'parent';
        trace_exit(function () {
            process.exit(0);
        });
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