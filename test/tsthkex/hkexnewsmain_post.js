var tracelog = require('../../tracelog');
var cheerio = require('cheerio');
var util = require('util');
var qs = require('querystring');
var baseop = require('../../baseop');
var path = require('path');


function createHkexNewsMainPost(options) {
    'use strict';
    var hknews = {};
    var setopt = options || {};
    var d = new Date();
    var s;

    hknews.lastdate = '';
    hknews.options = {};
    hknews.options.hfStatus = 'ACM';
    hknews.options.hfAlert = '';
    hknews.options.ex_startdate = '19990101';
    hknews.options.maxtries = 5;
    s = '';
    s += baseop.number_format_length(4, d.getFullYear());
    s += baseop.number_format_length(2, d.getMonth() + 1);
    s += baseop.number_format_length(2, d.getDate());
    hknews.options.ex_enddate = s;
    hknews.options.txt_stock_code = '02010';
    s = '';
    s += baseop.number_format_length(4, d.getFullYear());
    s += baseop.number_format_length(2, d.getMonth() + 1);
    s += baseop.number_format_length(2, d.getDate());
    hknews.options.txt_today = s;
    hknews.options.txt_stock_name = '';
    hknews.options.rdo_SelectDocType = 'rbAll';
    hknews.options.sel_tier_1 = '-2';
    hknews.options.sel_DocTypePrior2006 = '-1';
    hknews.options.sel_tier_2_group = '-2';
    hknews.options.sel_tier_2 = '-2';
    hknews.options.ddlTierTwo = '59,1,7';
    hknews.options.ddlTierTwoGroup = '19,5';
    hknews.options.txtKeyWord = '';
    hknews.options.rdo_SelectDateOfRelease = 'rbManualRange';
    hknews.options.sel_DateOfReleaseFrom_d = hknews.options.ex_startdate.substring(6, 8);
    hknews.options.sel_DateOfReleaseFrom_m = hknews.options.ex_startdate.substring(4, 6);
    hknews.options.sel_DateOfReleaseFrom_y = hknews.options.ex_startdate.substring(0, 4);
    hknews.options.sel_DateOfReleaseTo_d = hknews.options.ex_enddate.substring(6, 8);
    hknews.options.sel_DateOfReleaseTo_m = hknews.options.ex_enddate.substring(4, 6);
    hknews.options.sel_DateOfReleaseTo_y = hknews.options.ex_enddate.substring(0, 4);
    hknews.options.sel_defaultDateRange = 'SevenDays';
    hknews.options.rdo_SelectSortBy = 'rbDateTime';

    hknews.topdir = __dirname;


    if (baseop.is_valid_date(setopt.enddate)) {
        hknews.options.ex_enddate = setopt.enddate;
        hknews.options.sel_DateOfReleaseTo_d = hknews.options.ex_enddate.substring(6, 8);
        hknews.options.sel_DateOfReleaseTo_m = hknews.options.ex_enddate.substring(4, 6);
        hknews.options.sel_DateOfReleaseTo_y = hknews.options.ex_enddate.substring(0, 4);
    }

    if (baseop.is_valid_date(setopt.startdate)) {
        hknews.options.ex_startdate = setopt.startdate;
        hknews.options.sel_DateOfReleaseFrom_d = hknews.options.ex_startdate.substring(6, 8);
        hknews.options.sel_DateOfReleaseFrom_m = hknews.options.ex_startdate.substring(4, 6);
        hknews.options.sel_DateOfReleaseFrom_y = hknews.options.ex_startdate.substring(0, 4);
    }

    if (setopt.stockcode !== null && setopt.stockcode !== undefined) {
        hknews.options.txt_stock_code = setopt.stockcode;
    }

    if (setopt.stockname !== null && setopt.stockname !== undefined) {
        hknews.options.txt_stock_name = setopt.stockname;
    }

    if (setopt.topdir !== null && setopt.topdir !== undefined) {
        hknews.topdir = setopt.topdir;
    }

    hknews.topdir += path.sep;
    hknews.topdir += hknews.options.txt_stock_code;

    hknews.make_post_data = function (inputctrl, queryopt) {
        var postdata;
        var ctl00_dollar = 'ctl00$';
        postdata = '';
        postdata += '__VIEWSTATE=';
        postdata += qs.escape(inputctrl.attribs.value);
        postdata += util.format('&__VIEWSTATEENCRYPTED=&%stxt_today=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.txt_today));
        postdata += util.format('%shfStatus=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.hfStatus));
        postdata += util.format('%shfAlert=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.hfAlert));
        postdata += util.format('%stxt_stock_code=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.txt_stock_code));
        postdata += util.format('%stxt_stock_name=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.txt_stock_name));
        postdata += util.format('%srdo_SelectDocType=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.rdo_SelectDocType));
        postdata += util.format('%ssel_tier_1=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.sel_tier_1));
        postdata += util.format('%ssel_DocTypePrior2006=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.sel_DocTypePrior2006));
        postdata += util.format('%ssel_tier_2_group=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.sel_tier_2_group));
        postdata += util.format('%ssel_tier_2=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.sel_tier_2));
        postdata += util.format('%sddlTierTwo=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.ddlTierTwo));
        postdata += util.format('%sddlTierTwoGroup=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.ddlTierTwoGroup));
        postdata += util.format('%stxtKeyWord=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.txtKeyWord));
        postdata += util.format('%srdo_SelectDateOfRelease=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.rdo_SelectDateOfRelease));
        if (baseop.is_valid_date(queryopt.startdate)) {
            postdata += util.format('%ssel_DateOfReleaseFrom_d=', qs.escape(ctl00_dollar));
            postdata += queryopt.startdate.substring(6, 8);
            postdata += util.format('%ssel_DateOfReleaseFrom_m=', qs.escape(ctl00_dollar));
            postdata += queryopt.startdate.substring(4, 6);
            postdata += util.format('%ssel_DateOfReleaseFrom_y=', qs.escape(ctl00_dollar));
            postdata += queryopt.startdate.substring(0, 4);
        } else {
            postdata += util.format('%ssel_DateOfReleaseFrom_d=', qs.escape(ctl00_dollar));
            postdata += util.format('%s&', qs.escape(hknews.options.sel_DateOfReleaseFrom_d));
            postdata += util.format('%ssel_DateOfReleaseFrom_m=', qs.escape(ctl00_dollar));
            postdata += util.format('%s&', qs.escape(hknews.options.sel_DateOfReleaseFrom_m));
            postdata += util.format('%ssel_DateOfReleaseFrom_y=', qs.escape(ctl00_dollar));
            postdata += util.format('%s&', qs.escape(hknews.options.sel_DateOfReleaseFrom_y));
        }

        if (baseop.is_valid_date(queryopt.enddate)) {
            postdata += util.format('%ssel_DateOfReleaseTo_d=', qs.escape(ctl00_dollar));
            postdata += queryopt.enddate.substring(6, 8);
            postdata += util.format('%ssel_DateOfReleaseTo_m=', qs.escape(ctl00_dollar));
            postdata += queryopt.enddate.substring(4, 6);
            postdata += util.format('%ssel_DateOfReleaseTo_y=', qs.escape(ctl00_dollar));
            postdata += queryopt.enddate.substring(0, 4);
        } else {
            postdata += util.format('%ssel_DateOfReleaseTo_d=', qs.escape(ctl00_dollar));
            postdata += util.format('%s&', qs.escape(hknews.options.sel_DateOfReleaseTo_d));
            postdata += util.format('%ssel_DateOfReleaseTo_m=', qs.escape(ctl00_dollar));
            postdata += util.format('%s&', qs.escape(hknews.options.sel_DateOfReleaseTo_m));
            postdata += util.format('%ssel_DateOfReleaseTo_y=', qs.escape(ctl00_dollar));
            postdata += util.format('%s&', qs.escape(hknews.options.sel_DateOfReleaseTo_y));
        }
        postdata += util.format('%ssel_defaultDateRange=', qs.escape(ctl00_dollar));
        postdata += util.format('%s&', qs.escape(hknews.options.sel_defaultDateRange));
        postdata += util.format('%srdo_SelectSortBy=', qs.escape(ctl00_dollar));
        postdata += util.format('%s', qs.escape(hknews.options.rdo_SelectSortBy));
        return postdata;
    };

    hknews.post_handler = function (err, worker, next) {
        var parser;
        var inputs, i, input;
        var findinput;
        var tries = 0;
        var postdata;

        if (!baseop.is_non_null(worker.reqopt, 'hkexnewsmainoption')) {
            /*if we do not handle news make*/
            next(true, err);
            return;
        }

        if (err) {
            /*if we have nothing to do*/
            if (baseop.is_non_null(worker.reqopt.hkexnewsmainoption, 'maxtries')) {
                tries = worker.reqopt.hkexnewsmainoption.maxtries;
            }
            tries += 1;
            if (tries < hknews.options.maxtries) {
                worker.parent.queue(worker.url, {
                    hkexnewsmainoption: {
                        tries: tries
                    }
                });
            } else {
                tracelog.error('can not make hkexnewsmainoption (%s)', worker.url);
            }
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
        tries = 0;
        if (baseop.is_non_null(worker.reqopt.hkexnewsmainoption, 'tries')) {
            tries = worker.reqopt.hkexnewsmainoption.tries;
        }

        /*now we find the input ,so we should all things we should put post data*/
        postdata = hknews.make_post_data(findinput, worker.reqopt.hkexnewsmainoption);
        //tracelog.info('postdata (%s)', postdata);
        worker.parent.post_queue(worker.url, {
            hkexnewspaperoption: {
                downdir: hknews.topdir,
                tries: tries
            },
            reuse: true,
            reqopt: {
                body: postdata,
                timeout: 10000,
                headers: {
                    Referer: worker.url,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        });

        next(false, null);
    };

    return hknews;
}


module.exports = createHkexNewsMainPost;