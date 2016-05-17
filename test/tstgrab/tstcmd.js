var tracelog = require('../../tracelog');
var grabwork = require('../../grabwork');
var util = require('util');
var grab = grabwork();
var hkexnewsmain_post = require('./hkexnewsmain_post');
var hkexnewspaper_post = require('./hkexnewspaper_post');
var hkexnewsdownload_pre = require('./hkexnewsdownload_pre');
var random_delay = require('./random_delay');
var commander = require('commander');
var optcall;

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
    }, 0)
    .option('-U --url <url>', 'specify url', function (v, t) {
        'use strict';
        v = v;
        return t;
    }, 'http://www.hkexnews.hk/listedco/listconews/advancedsearch/search_active_main_c.aspx');

process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', function () {
    'use strict';
    trace_exit(0);
});
var main_notice = function (err, worker, next) {
    'use strict';
    if (err === null) {
        worker.main_timer = setTimeout(function () {
            var newerr;
            newerr = new Error(util.format('connect (%s) timeout', worker.url));
            tracelog.error('%s', JSON.stringify(newerr));
            worker.finish(newerr);
        }, 5000);
    }
    next(true, err);
};

var main_finish = function (err, worker, next) {
    'use strict';
    if (worker.main_timer !== undefined && worker.main_timer !== null) {
        clearTimeout(worker.main_timer);
        worker.main_timer = null;
    }
    next(err);
};

commander.parse(process.argv);
optcall = {};
optcall.parent = commander;
init_tracelog(optcall);


grab.add_pre(random_delay());
grab.add_pre(hkexnewsdownload_pre());
grab.add_post(hkexnewsmain_post());
grab.add_post(hkexnewspaper_post());

tracelog.info('url (%s)', commander.url);

grab.queue(commander.url, {
    hkexnewsmain: true,
    finish_callback: main_finish,
    notice_callback: main_notice
});