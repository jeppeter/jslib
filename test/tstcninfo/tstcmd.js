var tracelog = require('../../tracelog');
var grabwork = require('../../grabwork');
var baseop = require('../../baseop');
var util = require('util');
//var util = require('util');
var grab = grabwork();
var cninfomain = require('./cninfo_main');
var cninfoquery = require('./cninfo_query');
var download_pre = require('../../grabwork/download_pre');
var random_delay = require('../../grabwork/random_delay');
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
    .option('-s --stockcode <code>', 'stock code for china stock 6 bytes default(600000)', function (t, v) {
        'use strict';
        if (typeof t === 'string' && t.length === 6 && baseop.match_expr_i(t, '[0-9]+')) {
            return t;
        }
        usage(3, commander, util.format('<%s> not valid stockcode', t));
        return v;
    }, '600000')
    .option('-P --topdir <dir>', util.format('stock file store directory default(%s)', __dirname), function (t, v) {
        'use strict';
        v = v;
        return t;
    }, __dirname)
    .option('-w --watermark <watermark>', 'watermark to delay default is (20)', function (t, v) {
        'use strict';
        var tmpval;
        if (typeof t === 'string' && t.length === 5 && baseop.match_expr_i(t, '[0-9]+')) {
            tmpval = parseInt(t);
            if (tmpval < 256) {
                return tmpval;
            }
        }
        usage(3, commander, util.format('<%s> not valid watermark', t));
        return v;
    }, 20)
    .option('-U --url <url>', 'specify url default format(http://www.cninfo.com.cn/cninfo-new/disclosure/szse/showFulltext/%s)', function (t, v) {
        'use strict';
        v = v;
        return t;
    }, 'http://www.cninfo.com.cn/cninfo-new/disclosure/szse/showFulltext/%s');
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
grab.add_pre(download_pre(commander));
grab.add_post(random_delay(commander));
grab.add_post(cninfomain(commander));
grab.add_post(cninfoquery(commander));

commander.url = util.format(commander.url, commander.stockcode);
tracelog.info('url (%s)', commander.url);

grab.queue(commander.url, {
    cninfomain: commander.stockcode
});