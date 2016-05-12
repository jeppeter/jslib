var tracelog = require('../../tracelog');
var cheerio = require('cheerio');
var util = require('util');

function createHkexNewsMainPost(options) {
    'use strict';
    var hknews = {};
    var setopt = options || {};
    var d = new Date();

    hknews.options = {};
    hknews.options.hfStatus = 'ACM';
    hknews.options.hfAlert = '';
    hknews.options.ex_startdate = '19990101';
    hknews.options.ex_enddate = util.format('%04d%02d%02d', d.getFullYear(), d.getMonth() + 1, d.getDate());
    hknews.options.txt_stock_code = '02010';
    hknews.options.txt_today = util.format('%04d%02d%02d', d.getFullYear(), d.getMonth() + 1, d.getDate());
    hknews.options.txt_stock_name = '';
    hknews.options.rdo_SelectDocType = 'rbAll';
    hknews.options.sel_tier_1 = '-2';
    hknews.options.sel_DocTypePrior2006 = '-1';
    hknews.options.sel_tier_2_group = '-2';
    hknews.options.ddlTierTwo = '59,1,7';
    hknews.options.ddlTierTwoGroup = '19,5';
    hknews.options.txtKeyWord = '';
    hknews.options.rdo_SelectDateOfRelease = 'rbManualRange';
    hknews.options.sel_DateOfReleaseFrom_d = hknews.options.startdate.substring(6, 8);
    hknews.options.sel_DateOfReleaseFrom_m = hknews.options.startdate.substring(4, 6);
    hknews.options.sel_DateOfReleaseFrom_y = hknews.options.startdate.substring(0, 4);
    hknews.options.sel_DateOfReleaseTo_d = hknews.options.ex_enddate.substring(6, 8);
    hknews.options.sel_DateOfReleaseTo_m = hknews.options.ex_enddate.substring(4, 6);
    hknews.options.sel_DateOfReleaseTo_y = hknews.options.ex_enddate.substring(0, 4);
    hknews.options.sel_defaultDateRange = 'SevenDays';
    hknews.options.rdo_SelectSortBy = 'rbDateTime';


    if (setopt.enddate !== null && setopt.enddate !== undefined) {
        hknews.options.ex_enddate = setopt.enddate;
        hknews.options.sel_DateOfReleaseTo_d = hknews.options.ex_enddate.substring(6, 8);
        hknews.options.sel_DateOfReleaseTo_m = hknews.options.ex_enddate.substring(4, 6);
        hknews.options.sel_DateOfReleaseTo_y = hknews.options.ex_enddate.substring(0, 4);
    }

    if (setopt.startdate !== null && setopt.startdate !== undefined) {
        hknews.options.ex_startdate = setopt.startdate;
        hknews.options.sel_DateOfReleaseFrom_d = hknews.options.startdate.substring(6, 8);
        hknews.options.sel_DateOfReleaseFrom_m = hknews.options.startdate.substring(4, 6);
        hknews.options.sel_DateOfReleaseFrom_y = hknews.options.startdate.substring(0, 4);
    }

    if (setopt.stockcode !== null && setopt.stockcode !== undefined) {
        hknews.options.txt_stock_code = setopt.stockcode;
    }

    if (setopt.stockname !== null && setopt.stockname !== undefined) {
        hknews.options.txt_stock_name = setopt.stockname;
    }

    hknews.post_handler = function (err, worker, next) {
        var parser;
        var inputs, i, input;
        var findinput;
        if (err) {
            /*if we have nothing to do*/
            next(true, err);
            return;
        }

        if (worker.reqopt.hkexnewsmain === undefined || worker.reqopt.hkexnewsmain === null || !worker.reqopt.hkexnewsmain) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        /*now it is time ,we handle ,so we should no more to handle out*/
        //tracelog.info('htmldata (%s)', worker.htmldata);
        parser = cheerio.load(worker.htmldata);
        inputs = parser('input');
        tracelog.info('inputs (%d)', inputs.length);
        findinput = null;
        for (i = 0; i < inputs.length; i += 1) {
            input = inputs[i];
            if (input.attribs !== null && input.attribs !== undefined) {
                if (input.attribs.name !== null && input.attribs.name !== undefined) {
                    if (input.attribs.name === '__VIEWSTATE' && input.attribs.value !== null && input.attribs.value !== undefined) {
                        findinput = input;
                        break;
                    }
                }
            }
        }

        if (findinput === null) {
            /*we can not find the input we just return*/
            next(true, null);
            return;
        }

        /*now we find the input ,so we should all things*/

        next(false, null);
    };

    return hknews;
}


module.exports = createHkexNewsMainPost;