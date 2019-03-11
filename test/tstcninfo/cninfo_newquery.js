var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('grabwork');
var cheerio = require('cheerio');
var URL = require('url');

var get_attr_value = function (elm, parser, keyname) {
    'use strict';
    var s;
    parser = parser;
    s = '';
    if (elm[0] !== null && elm[0] !== undefined) {
        if (elm[0].attribs !== null && elm[0].attribs !== undefined) {
            if (elm[0].attribs[keyname] !== null && elm[0].attribs[keyname] !== undefined) {
                s += elm[0].attribs[keyname];
            }
        }

    } else {
        if (elm.attribs !== null && elm.attribs !== undefined) {
            if (elm.attribs[keyname] !== null && elm.attribs[keyname] !== undefined) {
                s += elm.attribs[keyname];
            }
        }
    }
    return s;
};


function createCninfoNewQuery(options) {
    'use strict';
    var cninfo;
    var d;
    cninfo = {};

    cninfo.options = {};
    cninfo.options.stockcode = '600000';
    cninfo.options.cninfoquerypath = '/new/hisAnnouncement/query';
    cninfo.options.startdate = '19990101';
    d = new Date();
    cninfo.options.enddate = '';
    cninfo.options.enddate += baseop.number_format_length(4, d.getFullYear());
    cninfo.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    cninfo.options.enddate += baseop.number_format_length(2, d.getDate());

    if (baseop.is_valid_string(options, 'stockcode') && baseop.is_valid_number(options.stockcode, false)) {
        cninfo.options.stockcode = options.stockcode;
    }

    if (baseop.is_valid_string(options, 'cninfoquerypath')) {
        cninfo.options.cninfoquerypath = options.cninfoquerypath;
    }

    if (baseop.is_valid_date(options.startdate)) {
        cninfo.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date(options.enddate)) {
        cninfo.options.enddate = options.enddate;
    }

    cninfo.post_handler = function (err, worker, next) {
        var queryurl;
        var parser;
        var column, columnval;
        var err2;
        var yeardate;
        var i;
        var postdata;
        var urlparser;
        var cninfoquery;

        if (!baseop.is_valid_string(worker.reqopt, 'cninfomain')) {
            next(true, err);
            return;
        }

        if (err) {
            /*we should query again*/
            jstracer.error('<GET::%s> error %s', worker.url, err);
            worker.parent.post_queue(worker.url, {
                priority: grabwork.MIN_PRIORITY,
                cninfomain: worker.reqopt.cninfomain,
                reqopt : {
                    body : worker.reqopt.cninfomain.body
                }
            });
            next(false, err);
            return;
        }

        


        /*ok ,we should have this*/
        next(false, null);
        return;
    };

    return cninfo;
}

module.exports = createCninfoMain;