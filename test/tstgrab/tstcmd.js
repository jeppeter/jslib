var tracelog = require('../../tracelog');
var grabwork = require('../../grabwork');
//var util = require('util');
var grab = grabwork();
var hkexnewsmain_post = require('./hkexnewsmain_post');
var hkexnewspaper_post = require('./hkexnewspaper_post');
var hkexnewsextend_post = require('./hkexnewsextend_post');
var hkexnewsdownload_pre = require('./hkexnewsdownload_pre');
var random_delay = require('./random_delay');
var commander = require('commander');

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

commander
    .version('0.2.0')
    .option('-U --url <url>', 'specify url', function (v, t) {
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
grab.add_post(hkexnewsmain_post());
grab.add_post(hkexnewspaper_post());
grab.add_post(hkexnewsextend_post());

tracelog.info('url (%s)', commander.url);

grab.queue(commander.url, {
    hkexnewsmain: true,
    reqopt: {
        timeout: 5000
    }
});