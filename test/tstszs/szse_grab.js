var jstracer = require('jstracer');
var baseop = require('../../baseop');
//var util = require('util');
var grabwork = require('../../grabwork');
var cheerio = require('cheerio');


var szse_get_ahrefs = function (htmldata) {
    'use strict';
    var parser;
    var content;
    var ahrefs = [];
    var idx;
    var ahref;
    var url;

    parser = cheerio.load(htmldata);
    content = parser('tr').find('td');
    for (idx = 0; idx < content.length; idx += 1) {
        if (content.eq(idx).attr('class') === 'td2') {
            ahref = content.eq(idx).children('a');
            url = ahref.attr('href');
            //console.log('content[%d] [%s][%s]', idx,url,name);
            ahrefs.push(url);
        }
    }
    return ahrefs;
};


function createSzseGrab(options) {
    'use strict';
    var szsegrab = {};
    if (options !== undefined && options !== null) {
        options = options;
    }

    szsegrab.post_handler = function (err, worker, next) {
        var ahrefs = [];
        var idx;
        var curfile = '';
        var cururl = '';
        if (!baseop.is_non_null(worker.reqopt, 'szsegrab')) {
            next(true, err);
            return;
        }

        if (err !== undefined && err !== null) {
            if (worker.reqopt.szsegrab.szsetries < worker.reqopt.szsegrab.szse_max_tries) {
                jstracer.warn('[%d] can not get [%s][%s] [%s]', worker.reqopt.szsegrab.szsetries, worker.reqopt.szsegrab.queryurl, worker.reqopt.body, err);
                worker.reqopt.szsegrab.szsetries += 1;
                grabwork.post_queue(worker.reqopt.szsegrab.queryurl, worker.reqopt);
                return;
            }
            jstracer.error('[%s] grab [%s][%s] totally failed [%s]', worker.reqopt.szsegrab.szsetries, worker.reqopt.szsegrab.queryurl, worker.reqopt.body, err);
            return;
        }

        ahrefs = szse_get_ahrefs(worker.htmldata);
        for (idx = 0; idx < ahrefs.length; idx += 1) {
            jstracer.trace('[%s][%s]', idx, ahrefs[idx]);
        }

    };

    return szsegrab;
}

module.exports = createSzseGrab;