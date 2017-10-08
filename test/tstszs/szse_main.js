var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var cheerio = require('cheerio');
var URL = require('url');



function createSzseMain(options, stockcode) {
    'use strict';
    var szse = null;
    var d;

    szse = {};
    szse.options = {};
    szse.options.stockcode = '000001';
    szse.options.startdate = '1999-01-01';
    szse.options.queryurl = 'http://disclosure.szse.cn/m/search0425.jsp';

    d = new Date();
    szse.options.enddate = '';
    szse.options.enddate += baseop.number_format_length(4, d.getFullYear());
    szse.options.enddate += '-';
    szse.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    szse.options.enddate += '-';
    szse.options.enddate += baseop.number_format_length(2, d.getDate());

    if (stockcode !== undefined && stockcode !== null) {
        szse.options.stockcode = stockcode;
    }

    if (baseop.is_valid_string(options, 'querypath')) {
        szse.options.queryurl = options.querypath;
    }

    if (baseop.is_valid_string(options, 'startdate') && options.startdate.length === 8) {
        szse.options.startdate = '';
        szse.options.startdate += options.startdate.substring(0, 4);
        szse.options.startdate += '-';
        szse.options.startdate += options.startdate.substring(4, 6);
        szse.options.startdate += '-';
        szse.options.startdate += options.startdate.substring(6, 8);
    }

    if (baseop.is_valid_string(options, 'enddate') && options.enddate.length === 8) {
        szse.options.enddate = '';
        szse.options.enddate += options.enddate.substring(0, 4);
        szse.options.enddate += '-';
        szse.options.enddate += options.enddate.substring(4, 6);
        szse.options.enddate += '-';
        szse.options.enddate += options.enddate.substring(6, 8);
    }

    szse.post_handler = function (err, worker, next) {
        var queryurl;
        var postdata;

        if (!baseop.is_valid_string(worker.reqopt, 'szsemain')) {
            next(true, err);
            return;
        }

        /*now it is we search ,so we should */
    };

    return szse;
}

function AddSzseMain(options, stockcode) {
    'use strict';
    var reqopt = {};
    var d;

    reqopt.stockcode = '000001';
    reqopt.startdate = '1999-01-01';
    reqopt.queryurl = 'http://disclosure.szse.cn/m/search0425.jsp';

    d = new Date();
    reqopt.enddate = '';
    reqopt.enddate += baseop.number_format_length(4, d.getFullYear());
    reqopt.enddate += '-';
    reqopt.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    reqopt.enddate += '-';
    reqopt.enddate += baseop.number_format_length(2, d.getDate());

    if (stockcode !== undefined && stockcode !== null) {
        reqopt.stockcode = stockcode;
    }

    if (baseop.is_valid_string(options, 'querypath')) {
        reqopt.queryurl = options.querypath;
    }

    if (baseop.is_valid_string(options, 'startdate') && options.startdate.length === 8) {
        reqopt.startdate = '';
        reqopt.startdate += options.startdate.substring(0, 4);
        reqopt.startdate += '-';
        reqopt.startdate += options.startdate.substring(4, 6);
        reqopt.startdate += '-';
        reqopt.startdate += options.startdate.substring(6, 8);
    }

    if (baseop.is_valid_string(options, 'enddate') && options.enddate.length === 8) {
        reqopt.enddate = '';
        reqopt.enddate += options.enddate.substring(0, 4);
        reqopt.enddate += '-';
        reqopt.enddate += options.enddate.substring(4, 6);
        reqopt.enddate += '-';
        reqopt.enddate += options.enddate.substring(6, 8);
    }

}

module.exports = createSzseMain;
module.exports.AddSzseMain = AddSzseMain;