var commander = require('commander');
var util = require('util');
var tracelog = require('../../tracelog');
var baseop = require('../../baseop');

commander.subname = '';

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


var usage = function (ec, cmd, fmt) {
    'use strict';
    var fp = process.stderr;
    if (ec === 0) {
        fp = process.stdout;
    }

    if (fmt !== undefined && typeof fmt === 'string' && fmt.length > 0) {
        fp.write(util.format('%s\n', fmt));
    }

    cmd.outputHelp(function (txt) {
        fp.write(txt);
        return '';
    });
    trace_exit(ec);
    return;
};



process.on('SIGINT', function () {
    'use strict';
    tracelog.warn('caught sig int');
    trace_exit(0);
    return;
});

process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s) (%s)', err, err.stack);
    trace_exit(3);
    return;
});


commander
    .version('0.3.0');

commander
    .command('mkdir <dirs...>')
    .description(' dirs... to make')
    .action(function (args, options) {
        'use strict';
        var errcode = 0;
        commander.subname = 'mkdir';
        tracelog.set_commander(options.parent);
        if (args.length === 0) {
            process.stderr.write('mkdir need an dir to make');
            trace_exit(3);
            return;
        }

        args.forEach(function (elm, idx) {
            baseop.mkdir_safe(elm, function (err) {
                if (err) {
                    tracelog.error('[%d](%s) error(%s)', idx, elm, err);
                    errcode = 3;
                    if (idx === (args.length - 1)) {
                        trace_exit(errcode);
                    }
                    return;
                }
                tracelog.info('[%d](%s) succ', idx, elm);
                if (idx === (args.length - 1)) {
                    trace_exit(errcode);
                }
                return;
            });
        });
        return;
    });

commander
    .command('testroot <args...>')
    .description(' to test whether is root')
    .action(function (args, options) {
        'use strict';

        commander.subname = 'testroot';
        tracelog.set_commander(options.parent);
        if (args.length === 0) {
            usage(3, commander, 'please set an dir');
            return;
        }

        args.forEach(function (elm, idx) {
            var isroot;
            isroot = baseop.is_root(elm);
            if (isroot) {
                console.log('[%d] (%s) is root', idx, elm);
            } else {
                console.log('[%d] (%s) is not root', idx, elm);
            }
            if (idx === (args.length - 1)) {
                trace_exit(0);
            }
            return;
        });
        return;
    });

commander
    .command('validdate <date>')
    .description(' validdate date')
    .action(function (datestr, options) {
        'use strict';
        var errcode = 0;
        commander.subname = 'validdate';
        tracelog.set_commander(options.parent);
        if (baseop.is_valid_date(datestr)) {
            console.log('<%s> is valid date', datestr);
        } else {
            console.error('<%s> is not valid date', datestr);
            errcode = 3;
        }
        trace_exit(errcode);
        return;
    });

commander
    .command('validnum <num>')
    .option('--is16', 'set is 16')
    .description(' validdate date')
    .action(function (numstr, options) {
        'use strict';
        var errcode = 0;
        commander.subname = 'validnum';
        tracelog.set_commander(options.parent);
        if (baseop.is_valid_number(numstr, options.is16)) {
            console.log('<%s> is valid number', numstr);
        } else {
            console.error('<%s> is not valid number', numstr);
            errcode = 3;
        }
        trace_exit(errcode);
        return;
    });

commander
    .command('parsenum <num>')
    .description(' parsenum number')
    .action(function (numstr, options) {
        'use strict';
        var errcode = 0;
        var num;
        commander.subname = 'parsenum';
        tracelog.set_commander(options.parent);
        num = baseop.parse_number(numstr);
        if (!isNaN(num)) {
            if (baseop.is_valid_float(numstr)) {
                console.log('<%s> number %s', numstr, num);
            } else {
                console.log('<%s> number %d', numstr, num);
            }
        } else {
            console.error('<%s> not valid number', numstr);
        }
        trace_exit(errcode);
        return;
    });

commander
    .command('readjson <jsonfile>')
    .description(' readjson and parse opt')
    .action(function (jsonfile, options) {
        'use strict';
        commander.subname = 'readjson';
        tracelog.set_commander(options.parent);
        baseop.read_json_parse(jsonfile, function (err, opt) {
            if (err) {
                console.error('read (%s) error(%s)', jsonfile, JSON.stringify(err));
                trace_exit(3);
                return;
            }

            console.log('<%s> (%s)', jsonfile, util.inspect(opt, {
                showHidden: true,
                depth: null
            }));
            trace_exit(0);
            return;
        });
        return;
    });

commander
    .command('datesplit <startdate> <enddate>')
    .description(' datesplit into several years')
    .action(function (startdate, enddate, options) {
        'use strict';
        var yeardate;
        commander.subname = 'datesplit';
        tracelog.set_commander(options.parent);
        yeardate = baseop.split_by_oneyear(startdate, enddate);
        tracelog.info('get date (%s) (%s) (%d)', startdate, enddate, yeardate.length);
        yeardate.forEach(function (elm, idx) {
            console.log('[%d] %s %s', idx, elm.startdate, elm.enddate);
        });
        trace_exit(0);
        return;
    });


commander
    .command('jsonparse <jsonfile> [value...]')
    .description('to parse jsonfile and get value')
    .action(function (jsonfile, values, options) {
        'use strict';
        commander.subname = 'jsonparse';
        tracelog.set_commander(options.parent);
        baseop.read_json_parse(jsonfile, function (err, opt) {
            if (err) {
                console.error('can not read(%s) error(%s)', jsonfile, JSON.stringify(err));
                trace_exit(3);
                return;
            }

            if (baseop.is_non_null(values) && values.length > 0) {

                values.forEach(function (elm, idx) {
                    if (baseop.is_non_null(opt, elm)) {
                        console.log('[%d]%s = %s', idx, elm, opt[elm]);
                    } else {
                        console.error('[%d]%s not defined', idx, elm);
                    }
                });
            } else {
                console.log('%s (%s)', jsonfile, util.inspect(opt, {
                    showHidden: true,
                    depth: null
                }));
            }
            trace_exit(0);
            return;
        });
    });

commander
    .command('jsonarray <jsonfile> [value]')
    .option('--num <number>', 'number array', function (v, t) {
        'use strict';
        t = t;
        return parseInt(v);
    }, 0)
    .description('to parse jsonfile and get value')
    .action(function (jsonfile, value, options) {
        'use strict';
        var idx;
        idx = options.num;
        commander.subname = 'jsonarray';
        tracelog.set_commander(options.parent);
        baseop.read_json_parse(jsonfile, function (err, opt) {
            if (err) {
                console.error('can not read(%s) error(%s)', jsonfile, JSON.stringify(err));
                trace_exit(3);
                return;
            }

            if (value !== null && value !== undefined) {

                if (baseop.is_non_null(opt, value)) {
                    console.log('%s[%d] = %s', value, idx, util.inspect(opt[value][options.num], {
                        showHidden: true,
                        depth: null
                    }));
                } else {
                    console.error('%s not defined', value);
                }
            } else {
                console.log('%s (%s)', jsonfile, util.inspect(opt, {
                    showHidden: true,
                    depth: null
                }));
            }
            trace_exit(0);
            return;
        });
    });

var get_annoucement = function (opt) {
    'use strict';
    var retval = {};
    var i, j;
    var curassign, curelm;
    var curpdf;

    if (!baseop.is_non_null(opt, 'classifiedAnnouncements')) {
        tracelog.error('can not get classifiedAnnouncements');
        return null;
    }

    if (!baseop.is_non_null(opt, 'totalAnnouncement')) {
        tracelog.error('can not get totalAnnouncement');
        return null;
    }

    retval.totalAnnouncement = opt.totalAnnouncement;
    retval.pdfs = [];

    if (opt.classifiedAnnouncements.length > 0) {
        for (i = 0; i < opt.classifiedAnnouncements.length; i += 1) {
            curassign = opt.classifiedAnnouncements[i];
            if (curassign.length > 0) {
                for (j = 0; j < curassign.length; j += 1) {
                    curelm = curassign[j];
                    if (!baseop.is_non_null(curelm, 'adjunctUrl')) {
                        tracelog.warn('[%d][%d] no adjunctUrl', i, j);
                    } else {
                        curpdf = {};
                        curpdf.adjunctUrl = curelm.adjunctUrl;
                        retval.pdfs.push(curpdf);
                    }
                }
            } else {
                if (!baseop.is_non_null(curassign, 'adjunctUrl')) {
                    tracelog.warn('[%d] can not get adjunctUrl', i);
                } else {
                    curpdf = {};
                    curpdf.adjunctUrl = curassign.adjunctUrl;
                    retval.pdfs.push(curpdf);
                }
            }
        }
    }


    return retval;
};

commander
    .command('getannounce <jsonfile>')
    .description('to get announcement value for cninfo')
    .action(function (jsonfile, options) {
        'use strict';
        commander.subname = 'getannounce';
        tracelog.set_commander(options.parent);
        baseop.read_json_parse(jsonfile, function (err, opt) {
            var retlists;
            if (err) {
                console.error('can not read(%s) error(%s)', jsonfile, JSON.stringify(err));
                trace_exit(3);
                return;
            }

            retlists = get_annoucement(opt);
            if (retlists === null) {
                console.error('can not get announcement');
                trace_exit(3);
                return;
            }

            retlists.pdfs.forEach(function (elm, idx) {
                console.log('[%d] pdfs (%s)', idx, elm.adjunctUrl);
            });

            trace_exit(0);
            return;
        });
    });


tracelog.init_commander(commander);
commander.parse(process.argv);

if (commander.subname.length === 0) {
    usage(3, commander, 'please specify a subcommand');
}