var tracelog = require('../../tracelog');
var grabwork = require('../../grabwork');
var baseop = require('../../baseop');
var util = require('util');
//var util = require('util');
var grab = grabwork();
var hkexnewsmain_post = require('./hkexnewsmain_post');
var hkexnewspaper_post = require('./hkexnewspaper_post');
var hkexnewsextend_post = require('./hkexnewsextend_post');
var hkexnewsdownload_pre = require('./hkexnewsdownload_pre');
var random_delay = require('./random_delay');
var commander = require('commander');
var curdate;
var d = new Date();

curdate = '';
curdate += baseop.number_format_length(4, d.getFullYear());
curdate += baseop.number_format_length(2, d.getMonth() + 1);
curdate += baseop.number_format_length(2, d.getDate());


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


commander
    .version('0.2.0')
    .option('-m --grabmaxsock <num>', 'grab max socket in one default(10)', function (t, v) {
        'use strict';
        v = v;
        return parseInt(t);
    }, 10)
    .option('-t --grabtimeout <time>', 'grab timeout in one deafult(10000)', function (t, v) {
        'use strict';
        v = v;
        return parseInt(t);
    }, 10000)
    .option('-S --startdate <date>', 'startdate search for deafult(19990101)', function (t, v) {
        'use strict';
        if (baseop.is_valid_date(t)) {
            return t;
        }
        usage(3, commander, util.format('<%s> not valid date', t));
        return v;
    }, '19990101')
    .option('-E --enddate <date>', util.format('enddate search for default(%s)', curdate), function (t, v) {
        'use strict';
        if (baseop.is_valid_date(t)) {
            return t;
        }
        usage(3, commander, util.format('<%s> not valid date', t));
        return v;
    }, curdate)
    .option('-s --stockcode <code>', 'stock code for HKEX as 5 bytes default(02010)', function (t, v) {
        'use strict';
        if (typeof t === 'string' && t.length === 5 && baseop.match_expr_i(t, '[0-9]+')) {
            return t;
        }
        usage(3, commander, util.format('<%s> not valid stockcode', t));
        return v;
    }, '02010')
    .option('-U --url <url>', 'specify url', function (t, v) {
        'use strict';
        v = v;
        return t;
    }, 'http://www.hkexnews.hk/listedco/listconews/advancedsearch/search_active_main_c.aspx');
tracelog.init_commander(commander);

process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', function () {
    'use strict';
    trace_exit(0);
});

commander.parse(process.argv);
tracelog.set_commander(commander);


grab.add_pre(random_delay());
grab.add_pre(hkexnewsdownload_pre());
grab.add_post(hkexnewsmain_post(commander));
grab.add_post(hkexnewspaper_post());
grab.add_post(hkexnewsextend_post());

tracelog.info('url (%s)', commander.url);

grab.queue(commander.url, {
    hkexnewsmain: true,
    reqopt: {
        timeout: 5000
    }
});