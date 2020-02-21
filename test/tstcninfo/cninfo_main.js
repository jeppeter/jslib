var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
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


function createCninfoMain(options) {
    'use strict';
    var cninfo;
    var d;
    cninfo = {};

    cninfo.options = {};
    cninfo.options.stockcode = '600000';
    cninfo.options.cninfoquerypath = '/cninfo-new/announcement/query';
    cninfo.options.startdate = '1999-01-01';
    d = new Date();
    cninfo.options.enddate = '';
    cninfo.options.enddate += baseop.number_format_length(4, d.getFullYear());
    cninfo.options.enddate += '-';
    cninfo.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    cninfo.options.enddate += '-';
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
            worker.parent.queue(worker.url, {
                priority: grabwork.MIN_PRIORITY,
                cninfomain: worker.reqopt.cninfomain
            });
            next(false, err);
            return;
        }

        /*now it is ok so we should get the cheerio*/
        parser = cheerio.load(worker.htmldata);
        column = parser('#column_hidden_input');
        column = column.eq(0);
        columnval = get_attr_value(column, parser, 'value');
        if (columnval === '') {
            err2 = new Error('can not get column_hidden_input.value');
            jstracer.error('can not get column_hidden_input.value');
            next(false, err2);
            return;
        }

        /*ok, we should give the value*/
        yeardate = baseop.split_by_oneyear(cninfo.options.startdate, cninfo.options.enddate);
        if (yeardate.length === 0) {
            err2 = new Error(util.format('can not split date (%s - %s)', cninfo.options.startdate, cninfo.options.enddate));
            jstracer.error('error(%s)', err2);
            next(false, err2);
            return;
        }

        urlparser = URL.parse(worker.url);
        queryurl = util.format('%s//%s%s', urlparser.protocol, urlparser.host, cninfo.options.cninfoquerypath);

        for (i = 0; i < yeardate.length; i += 1) {
            postdata = '';
            postdata += util.format('stock=%s', worker.reqopt.cninfomain);
            postdata += '&searchkey=&category=&pageNum=1&pageSize=30&';
            postdata += util.format('column=%s', columnval);
            postdata += '&tabName=fulltext&sortName=&sortType=&limit=&';
            postdata += util.format('seDate=%s+~+%s', yeardate[i].startdate, yeardate[i].enddate);
            cninfoquery = {};
            cninfoquery.stockcode = worker.reqopt.cninfomain;
            cninfoquery.pagenum = 1;
            cninfoquery.pagesize = 30;
            cninfoquery.column = columnval;
            cninfoquery.startdate = yeardate[i].startdate;
            cninfoquery.enddate = yeardate[i].enddate;
            cninfoquery.retry = 0;
            jstracer.info('post query (%s) (%s)', queryurl, postdata);
            worker.parent.post_queue(queryurl, {
                reqopt: {
                    body: postdata,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    }
                },
                cninfoquery: cninfoquery
            });
        }
        /*ok ,we should have this*/
        next(false, null);
        return;
    };

    return cninfo;
}

module.exports = createCninfoMain;