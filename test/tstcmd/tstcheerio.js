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

var get_data_name = function (elm, selector, idx, jdx) {
    'use strict';
    var s;
    s = '';
    if (jdx === undefined || jdx === null) {
        s += util.format('[%d](%s)', idx, selector);
    } else {
        s += util.format('[%d.%d](%s)', idx, jdx, selector);
    }
    s += '(';
    if (typeof elm.data === 'function') {
        s += elm.data();
    } else if (typeof elm.data === 'string') {
        s += elm.data;
    } else {
        s += 'undefined';
    }

    s += ')=(';

    if (typeof elm.text === 'function') {
        s += elm.text();
    } else if (typeof elm.text === 'string') {
        s += elm.text;
    } else {
        s += 'undefined';
    }
    s += ')';
    return s;
};

var get_child_name = function (elm, parser) {
    'use strict';
    var s;
    parser = parser;
    s = '';
    if (typeof elm.name === 'function') {
        s += elm.name();
    } else if (typeof elm.name === 'string') {
        s += elm.name;
    } else {
        s += 'undefined';
    }
    return s;
};



process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', function () {
    'use strict';
    trace_exit(0);
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

        parser = cheerio.load(data, {
            xmlMode: true
        });
        content = parser(selector);
        callback(parser, content, function (ec) {
            trace_exit(ec);
        });
        return;
    });
};

var traverse_next = function (parser, tabs, cont, travers_state) {
    'use strict';
    var idx;
    var curchild;
    var allchidrens;
    var pathname;
    allchidrens = travers_state.allchidrens;
    if (cont && allchidrens !== null) {
        idx = allchidrens.idx;
        if (idx < allchidrens.children.length) {
            curchild = allchidrens.children.eq(idx);
            allchidrens.idx += 1;
            pathname = allchidrens.pathname;
            travers_state.callback_fn(parser, tabs, pathname, idx, curchild, travers_state);
            allchidrens = null;
            return;
        }
    }

    if (allchidrens === null) {
        travers_state.last_children = null;
        travers_state.allchidrens = null;
        allchidrens = null;
        return;
    }
    /*now it will for call*/
    if (allchidrens.prev_children === null) {
        /*we get all trasversed ,so we do this ok*/
        travers_state.last_children = null;
        travers_state.allchidrens = null;
        allchidrens = null;
        return;
    }

    /*we pop the last*/
    travers_state.allchidrens = allchidrens.prev_children;
    pathname = travers_state.allchidrens.pathname;
    travers_state.travers_fn(parser, tabs - 1, pathname, travers_state);
    return;
};


var traverse_get = function (parser, tabs, travers_state) {
    'use strict';
    var idx;
    var allchidrens = {};
    var curallchilrens = null;
    var curchild;
    var pathname;

    curallchilrens = travers_state.allchidrens;
    if (curallchilrens === null || curallchilrens === undefined) {
        return;
    }

    if (curallchilrens.mainidx < curallchilrens.children.length) {
        idx = curallchilrens.mainidx;
        curallchilrens.mainidx += 1;
        curchild = curallchilrens.children.eq(idx);
        allchidrens = {};
        allchidrens.idx = 0;
        /*we search for 1st ok*/
        allchidrens.mainidx = 1;
        allchidrens.children = curchild.children();
        allchidrens.prev_children = curallchilrens;
        pathname = curallchilrens.pathname;
        if (pathname.length > 0) {
            pathname += ".";
        }
        pathname += get_child_name(curchild, parser);
        allchidrens.pathname = pathname;
        travers_state.allchidrens = allchidrens;
        travers_state.next_fn(parser, tabs + 1, true, travers_state);
        return;
    }

    /*ok we should make the upper calling*/
    if (curallchilrens.prev_children === null) {
        travers_state.allchidrens = null;
        return;
    }

    /*to go to the upper*/
    /*we pop the last*/
    travers_state.allchidrens = allchidrens.prev_children;
    travers_state.travers_fn(parser, tabs - 1, travers_state);
    return;
};

var output_traverse = function (parser, tabs, pathname, allchidrens, idx, curchild, travers_state) {
    'use strict';
    var s;
    var i;
    allchidrens = allchidrens;
    if (curchild === null || curchild === undefined || curchild[0] === undefined || curchild[0] === null || curchild[0].name === undefined || curchild[0].name === null) {
        return;
    }

    if (curchild.length === null || curchild.length === undefined || curchild.length === 0) {
        return;
    }

    tracelog.info('curchild (%s)', util.inspect(curchild, {
        showHidden: true,
        depth: 3
    }));
    s = '';
    for (i = 0; i < tabs; i += 1) {
        s += '    ';
    }
    s += util.format('[%d]{%s.%s} (%s)', idx, pathname, curchild[0].name, curchild.text());
    console.log('%s', s);
    travers_state.travers_fn(parser, tabs, pathname, curchild, travers_state);
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
    .option('-s --selector <selector>', 'selector ', function (v, t) {
        'use strict';
        t = t;
        return v;
    }, '')
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
                return;
            }
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
                return;
            }
            console.log('{%s} parent(%s)', content.parent().text());
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
                return;
            }
            var idx;
            idx = 0;
            content.each(function () {
                console.log('{%s}[%d]children (%s)', options.parent.selector, idx, parser(this).text());
                idx += 1;
            });
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
                return;
            }
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
                return;
            }
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
            exit_fn(0);
        });
    });


commander
    .command('traverse <str>')
    .action(function (args, options) {
        'use strict';
        init_tracelog(options);
        options = options;
        commander.subname = 'traverse';
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

        tracelog.info('args %s', args);
        call_cheerparser(args, options.parent.selector, function (parser, content, exit_fn) {
            var travers_state;
            if (content === null || content === undefined) {
                tracelog.error('can not find(%s) in (%s)', options.parent.selector, args);
                exit_fn(4);
                return;
            }
            travers_state = {};
            travers_state.callback_fn = output_traverse;
            travers_state.next_fn = traverse_next;
            travers_state.travers_fn = traverse_get;
            traverse_get(parser, 0, '', content, travers_state);
            exit_fn(0);
        });
    });

commander
    .command('childrens <str>')
    .action(function (args, options) {
        'use strict';
        init_tracelog(options);
        commander.subname = 'childrens';
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

        tracelog.info('args %s', args);
        call_cheerparser(args, options.parent.selector, function (parser, content, exit_fn) {
            var children;
            var curelm;
            var idx, jdx;
            var s;
            var curchild; //, siblings;
            parser = parser;
            if (content.length === 0) {
                tracelog.info('length %d', content.length);
                exit_fn(0);
                return;
            }

            tracelog.info('length %d', content.length);
            jdx = 0;
            for (jdx = 0; jdx < content.length; jdx += 1) {
                curelm = content.eq(jdx);
                children = curelm.children();
                s = get_data_name(curelm, options.parent.selector, jdx, null);
                console.log(s);
                idx = 0;
                //tracelog.info('children %d', children.length);
                for (idx = 0; idx < children.length; idx += 1) {
                    curchild = children.eq(idx);
                    s = get_data_name(curchild, options.parent.selector, jdx, idx);
                    console.log(s);
                    if (true) {
                        tracelog.info('[%d] (%s)', idx, util.inspect(curchild, {
                            showHidden: true,
                            depth: 2
                        }));
                    } else {
                        tracelog.info('[%d] type (%s) name(%s)', idx, curchild.type(), curchild.name());
                    }
                }
            }
            exit_fn(0);
            return;
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