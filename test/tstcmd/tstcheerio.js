var cheerio = require('cheerio');
var commander = require('commander');
var tracelog = require('../../tracelog');
var util = require('util');
var fs = require('fs');
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

process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

var call_cheerparser = function (fname, selector, callback) {
    'use strict';
    fs.readFile(fname, function (err, data) {
        var parser;
        var content;
        if (err) {
            tracelog.error('get (%s) error (%s)', fname, JSON.stringify(err));
            trace_exit(4);
            return;
        }

        parser = cheerio.load(data);
        content = parser(selector);
        callback(parser, content, function (ec) {
            trace_exit(ec);
        });
        return;
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
    .command('text <str>')
    .action(function (args, options) {
        'use strict';
        init_tracelog(options);
        options = options;
        commander.subname = 'text';
        if (args === null || args === undefined || args.length < 1) {
            tracelog.error('need instr restr\n');
            trace_exit(3);
            return;
        }

        if (options.parent.selector.length === 0) {
            tracelog.error('need selector set\n');
            trace_exit(3);
            return;
        }

        tracelog.info('args %s', args);

        call_cheerparser(args, options.parent.selector, function (parser, content, exit_fn) {
            tracelog.trace('parser (%s)', util.inspect(parser, {
                showHidden: true,
                depth: 3
            }));
            if (content === null || content === undefined) {
                console.log('can not find(%s) in (%s)', options.parent.selector, args);
                exit_fn(4);
            } else {
                //console.log('<%s> (%s)', options.parent.selector, content.text());
                if (Array.isArray(content)) {
                    content.forEach(function (elm, idx) {
                        console.log('<%s>[%d] (%s)', options.parent.selector, idx, elm.text());
                        tracelog.trace('<%s>[%d] (%s)', options.parent.selector, idx, util.inspect(elm, {
                            showHidden: true,
                            depth: 3
                        }));
                    });
                } else {
                    console.log('<%s> (%s)', options.parent.selector, content.text());
                    tracelog.trace('<%s> (%s)', options.parent.selector, util.inspect(content, {
                        showHidden: true,
                        depth: 3
                    }));
                }
            }
            exit_fn(0);
        });
    });

commander
    .command('parent <str>')
    .action(function (args, options) {
        'use strict';
        init_tracelog(options);
        options = options;
        commander.subname = 'parent';
        if (args === null || args === undefined || args.length < 1) {
            tracelog.error('need instr restr\n');
            trace_exit(3);
            return;
        }

        if (options.parent.selector.length === 0) {
            tracelog.error('need selector set\n');
            trace_exit(3);
            return;
        }

        tracelog.info('args %s', args);
        call_cheerparser(args, options.parent.selector, function (parser, content, exit_fn) {
            tracelog.trace('parser (%s)', util.inspect(parser, {
                showHidden: true,
                depth: 3
            }));
            if (content === null || content === undefined) {
                console.log('can not find(%s) in (%s)', options.parent.selector, args);
                exit_fn(4);
            } else {
                console.log('{%s} parent(%s)', content.parent().text());
            }
            exit_fn(0);
        });
    });

commander
    .command('each <str>')
    .action(function (args, options) {
        'use strict';
        init_tracelog(options);
        options = options;
        commander.subname = 'each';
        if (args.length < 1) {
            tracelog.error('need instr restr\n');
            trace_exit(3);
            return;
        }

        if (options.parent.selector.length === 0) {
            tracelog.error('need selector set\n');
            trace_exit(3);
            return;
        }
        tracelog.trace('parent (%s)', util.inspect(options.parent, {
            showHidden: true,
            depth: 3
        }));

        tracelog.info('args %s', args);
        call_cheerparser(args, options.parent.selector, function (parser, content, exit_fn) {
            tracelog.trace('parser (%s)', util.inspect(parser, {
                showHidden: true,
                depth: 3
            }));
            if (content === null || content === undefined) {
                tracelog.error('can not find(%s) in (%s)', options.parent.selector, args);
                exit_fn(4);
            } else {
                var idx;
                idx = 0;
                content.each(function () {
                    console.log('{%s}[%d]children (%s)', options.parent.selector, idx, parser(this).text());
                    idx += 1;
                });
            }
            exit_fn(0);
        });
    });

commander
    .command('find <str>')
    .option('--children <children>', 'children to specify for find', function (v, t) {
        'use strict';
        t = t;
        return v;
    }, '')
    .action(function (args, options) {
        'use strict';
        init_tracelog(options);
        options = options;
        commander.subname = 'find';
        if (args.length < 1) {
            tracelog.error('need instr restr\n');
            trace_exit(3);
            return;
        }

        if (options.parent.selector.length === 0) {
            tracelog.error('need selector set\n');
            trace_exit(3);
            return;
        }
        tracelog.trace('parent (%s)', util.inspect(options.parent, {
            showHidden: true,
            depth: 3
        }));

        if (options.children === '' || options.children === undefined || options.children === null) {
            tracelog.error('need a --children set\n');
            trace_exit(3);
            return;
        }

        tracelog.info('args %s', args);
        call_cheerparser(args, options.parent.selector, function (parser, content, exit_fn) {
            var children;
            tracelog.trace('parser (%s)', util.inspect(parser, {
                showHidden: true,
                depth: 3
            }));
            if (content === null || content === undefined) {
                tracelog.error('can not find(%s) in (%s)', options.parent.selector, args);
                exit_fn(4);
            } else {
                children = content.find(options.children);
                if (children === null || children === undefined) {
                    tracelog.error('can not find (%s) in (%s)', options.children, options.parent.selector);
                    exit_fn(4);
                }
                tracelog.trace('{%s->%s}children (%s)', options.parent.selector, options.children, util.inspect(children, {
                    showHidden: true,
                    depth: 3
                }));
                console.log('{[%s]->[%s]}children (%d)', options.parent.selector, options.children, children.length);
            }
            exit_fn(0);
        });
    });


commander
    .command('attr <str>')
    .option('--attr <attrname>', 'specify attrname', function (v, t) {
        'use strict';
        t = t;
        return v;
    }, '')
    .action(function (args, options) {
        'use strict';
        init_tracelog(options);
        options = options;
        commander.subname = 'attr';
        if (args.length < 1) {
            tracelog.error('need instr restr\n');
            trace_exit(3);
            return;
        }

        if (options.parent.selector.length === 0) {
            tracelog.error('need selector set\n');
            trace_exit(3);
            return;
        }
        tracelog.trace('parent (%s)', util.inspect(options.parent, {
            showHidden: true,
            depth: 3
        }));

        if (options.attr === undefined || options.attr === null) {
            tracelog.error('need a --children set\n');
            trace_exit(3);
            return;
        }

        tracelog.info('args %s', args);
        call_cheerparser(args, options.parent.selector, function (parser, content, exit_fn) {
            tracelog.trace('parser (%s)', util.inspect(parser, {
                showHidden: true,
                depth: 3
            }));
            if (content === null || content === undefined) {
                tracelog.error('can not find(%s) in (%s)', options.parent.selector, args);
                exit_fn(4);
            } else {
                var idx;
                if (options.attr === '') {
                    idx = 0;
                    content.each(function () {
                        var keys;
                        var self;
                        self = this;
                        keys = Object.keys(self.attribs);
                        keys.forEach(function (elm) {
                            console.log('{%s}[%d] (%s = %s)', options.parent.selector, idx, elm, self.attribs[elm]);
                        });
                        idx += 1;
                    });
                } else {
                    idx = 0;
                    content.each(function () {
                        console.log('{%s}[%d] (%s = %s)', options.parent.selector, idx, options.attr, parser(this).attr(options.attr));
                        idx += 1;
                    });
                }
            }
            exit_fn(0);
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