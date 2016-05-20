var cheerio = require('cheerio');
var commander = require('commander');
var tracelog = require('../../tracelog');
var util = require('util');
var fs = require('fs');
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

var get_data_name = function (elm, selector, idx, jdx) {
    'use strict';
    var s;
    var valuename = 'text';
    var keys;
    s = '';
    if (jdx === undefined || jdx === null) {
        s += util.format('[%d](%s)', idx, selector);
    } else {
        s += util.format('[%d.%d](%s)', idx, jdx, selector);
    }
    s += '(';
    if (typeof elm[0].name === 'function') {
        s += elm[0].name();
    } else if (typeof elm[0].name === 'string') {
        s += elm[0].name;
    } else {
        s += 'undefined';
    }
    if (elm[0].attribs !== undefined && elm[0].attribs !== null) {
        keys = Object.keys(elm[0].attribs);
        if (keys.length > 0) {
            s += ') attrib(';
            keys.forEach(function (elmattr, idx) {
                if (idx > 0) {
                    s += ',';
                }
                s += util.format('%s="%s"', elmattr, elm[0].attribs[elmattr]);
            });
        }
    }

    s += ')=(';

    if (typeof elm[valuename] === 'function') {
        s += elm[valuename]();
    } else if (typeof elm[valuename] === 'string') {
        s += elm[valuename];
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
    if (typeof elm[0].name === 'function') {
        s += elm[0].name();
    } else if (typeof elm[0].name === 'string') {
        s += elm[0].name;
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
            xmlMode: true,
            ignoreWhitespace: true
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
    var allchildrens;
    var pathname;
    allchildrens = travers_state.allchildrens;
    if (cont && allchildrens !== null) {
        idx = allchildrens.idx;
        if (idx < allchildrens.children.length) {
            curchild = allchildrens.children.eq(idx);
            allchildrens.idx += 1;
            pathname = allchildrens.pathname;
            tracelog.info('{%s}[%d]', pathname, idx);
            travers_state.callback_fn(parser, tabs, pathname, idx, curchild, travers_state);
            allchildrens = null;
            return;
        }
    }

    if (allchildrens === null) {
        travers_state.last_children = null;
        travers_state.allchildrens = null;
        allchildrens = null;
        tracelog.info('');
        return;
    }
    /*now it will for call*/
    if (allchildrens.prev_children === null) {
        /*we get all trasversed ,so we do this ok*/
        travers_state.allchildrens = null;
        allchildrens = null;
        tracelog.info('');
        return;
    }

    /*we pop the last*/
    travers_state.allchildrens = allchildrens.prev_children;
    pathname = travers_state.allchildrens.pathname;
    travers_state.travers_fn(parser, tabs - 1, pathname, travers_state);
    return;
};


var traverse_get = function (parser, tabs, travers_state) {
    'use strict';
    var idx;
    var allchildrens = {};
    var curallchildrens = null;
    var curchild;
    var pathname;

    curallchildrens = travers_state.allchildrens;
    if (curallchildrens === null || curallchildrens === undefined) {
        tracelog.info('');
        return;
    }

    tracelog.info('{%s} (%d) (%d)', curallchildrens.pathname, curallchildrens.mainidx, curallchildrens.children.length);
    while (curallchildrens.mainidx < curallchildrens.children.length) {
        idx = curallchildrens.mainidx;
        curallchildrens.mainidx += 1;
        curchild = curallchildrens.children.eq(idx);
        allchildrens = {};
        allchildrens.idx = 0;
        /*we search for 1st ok*/
        allchildrens.mainidx = 0;
        allchildrens.children = curchild.children();
        if (allchildrens.children.length > 0) {
            allchildrens.prev_children = curallchildrens;
            pathname = curallchildrens.pathname;
            if (pathname.length > 0) {
                pathname += ".";
            }
            pathname += get_child_name(curchild, parser);
            allchildrens.pathname = pathname;
            travers_state.allchildrens = allchildrens;
            travers_state.next_fn(parser, tabs + 1, true, travers_state);
            return;
        }
        tracelog.info('[%d]{%s} child 0', idx, curallchildrens.pathname);
        if (idx > 0) {
            /*the first we have search before*/
            travers_state.callback_fn(parser, tabs, curallchildrens.pathname, idx, curchild, travers_state);
            return;
        }
    }

    /*ok we should make the upper calling*/
    if (curallchildrens.prev_children === null) {
        travers_state.allchildrens = null;
        tracelog.info('');
        return;
    }

    /*to go to the upper*/
    /*we pop the last*/
    travers_state.allchildrens = curallchildrens.prev_children;
    curallchildrens = travers_state.allchildrens;
    /*tracelog.info('[%d] (%s)', tabs - 1, util.inspect(travers_state, {
        showHidden: true,
        depth: 3
    }));*/
    travers_state.travers_fn(parser, tabs - 1, travers_state);
    return;
};

var output_traverse = function (parser, tabs, pathname, idx, curchild, travers_state) {
    'use strict';
    var s;
    var i;

    /*tracelog.info('curchild (%s)', util.inspect(curchild, {
        showHidden: true,
        depth: 3
    }));*/
    s = '';
    for (i = 0; i < tabs; i += 1) {
        s += '    ';
    }
    s += get_data_name(curchild, pathname, idx, null);
    console.log(s);
    /*deep first search*/
    travers_state.travers_fn(parser, tabs, travers_state);
    return;
};



commander
    .version('0.2.0')
    .option('-s --selector <selector>', 'selector ', function (v, t) {
        'use strict';
        t = t;
        return v;
    }, '');

tracelog.init_commander(commander);


commander
    .command('text <str>')
    .action(function (args, options) {
        'use strict';
        tracelog.set_commander(options.parent);
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
        tracelog.set_commander(options.parent);
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
        tracelog.set_commander(options.parent);
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
        tracelog.set_commander(options.parent);
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
            var idx, jdx;
            var curchild, curcon;
            var s;
            tracelog.trace('parser (%s)', util.inspect(parser, {
                showHidden: true,
                depth: 3
            }));
            for (idx = 0; idx < content.length; idx += 1) {
                curcon = content.eq(idx);
                children = curcon.find(options.children);
                s = get_data_name(curcon, options.parent.selector, idx, null);
                console.log(s);
                for (jdx = 0; jdx < children.length; jdx += 1) {
                    curchild = children.eq(jdx);
                    s = get_data_name(curchild, options.parent.selector, idx, jdx);
                    console.log(s);
                }
            }
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
        tracelog.set_commander(options.parent);
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
        /*tracelog.trace('parent (%s)', util.inspect(options.parent, {
            showHidden: true,
            depth: 3
        }));*/

        if (options.attr === undefined || options.attr === null) {
            tracelog.error('need a --children set\n');
            trace_exit(3);
            return;
        }

        tracelog.info('args %s', args);
        call_cheerparser(args, options.parent.selector, function (parser, content, exit_fn) {
            /*tracelog.trace('parser (%s)', util.inspect(parser, {
                showHidden: true,
                depth: 3
            }));*/
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
        tracelog.set_commander(options.parent);
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
            travers_state.allchildrens = {};
            travers_state.allchildrens.children = content;
            /*we find first*/
            travers_state.allchildrens.mainidx = 0;
            travers_state.allchildrens.prev_children = null;
            travers_state.allchildrens.idx = 0;
            travers_state.allchildrens.pathname = '';
            traverse_get(parser, 0, travers_state);
            exit_fn(0);
        });
    });

commander
    .command('childrens <str>')
    .action(function (args, options) {
        'use strict';
        tracelog.set_commander(options.parent);
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

commander
    .command('childselect <str...> (filename selector)')
    .action(function (args, options) {
        'use strict';
        tracelog.set_commander(options.parent);
        commander.subname = 'childselect';
        if (args.length < 2) {
            tracelog.error('need file\n');
            trace_exit(3);
            return;
        }

        if (options.parent.selector.length === 0) {
            tracelog.error('need selector set\n');
            trace_exit(3);
            return;
        }

        tracelog.info('args %s', args);
        call_cheerparser(args[0], options.parent.selector, function (parser, content, exit_fn) {
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
                tracelog.info('children %d', children.length);
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