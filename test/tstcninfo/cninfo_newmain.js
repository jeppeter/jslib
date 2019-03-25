var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('grabwork');



function createCninfoNewMain(options) {
    'use strict';
    var cninfo;
    var d;
    cninfo = {};

    cninfo.options = {};
    cninfo.options.stockcode = '600000';
    cninfo.options.startdate = '19990101';
    d = new Date();
    cninfo.options.enddate = '';
    cninfo.options.enddate += baseop.number_format_length(4, d.getFullYear());
    cninfo.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    cninfo.options.enddate += baseop.number_format_length(2, d.getDate());

    if (baseop.is_valid_string(options, 'stockcode') && baseop.is_valid_number(options.stockcode, false)) {
        cninfo.options.stockcode = options.stockcode;
    }


    if (baseop.is_valid_date(options.startdate)) {
        cninfo.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date(options.enddate)) {
        cninfo.options.enddate = options.enddate;
    }

    cninfo.post_next_error = function(err, worker, next) {
        jstracer.error('<GET::%s> error %s', worker.url, err);
        worker.parent.post_queue(worker.url, {
            priority: grabwork.MIN_PRIORITY,
            cninfomain: worker.reqopt.cninfomain,
        });
        next(false, err);
        return;
    };

    cninfo.post_handler = function (err, worker, next) {
        var jdata;


        if (!baseop.is_valid_string(worker.reqopt, 'cninfomain')) {
            next(true, err);
            return;
        }

        if (err) {
            /*we should query again*/
            cninfo.post_next_error(err,worker,next);
            return;
        }

        /*now it is ok ,so we should calculate the query */
        try{
            var arr;
            jdata = JSON.parse(data);
            if (!baseop.is_non_null(jdata['classifiedAnnouncements'])) {
                cninfo.post_next_error(new Error('no classifiedAnnouncements'),worker,next);
                return;
            }

            arr = jdata['classifiedAnnouncements'];
            if (! Array.isArray(arr)) {
                cninfo.post_next_error(new Error('classifiedAnnouncements not array type'), worker, next);
                return;
            }

            arr = arr[0];
            if (! Array.isArray(arr)) {
                cninfo.post_next_error(new Error('classifiedAnnouncements[0] not array type'), worker, next);
                return;
            }

            arr = arr[0];
            if (! baseop.is_non_null(arr)) {
                cninfo.post_next_error(new Error('classifiedAnnouncements[0][0] null'), worker, next);
                return;
            }
            if (!baseop.is_non_null(arr['orgId'])) {
                cninfo.post_next_error(new Error('classifiedAnnouncements[0][0][orgId] null'), worker, next);
                return;                
            }


        }
        catch(e) {
            cninfo.post_next_error(e, worker, next);
            return;
        }

        /*ok ,we should have this*/
        next(false, null);
        return;
    };

    cninfo.format_url = function() {
        'use strict';
        var urlret ;

        urlret = 'http://www.cninfo.com.cn/new/singleDisclosure/fulltext?stock=';
        urlret += util.format('%s&pageSize=20&pageNum=1&tabname=latest&plate=', cninfo.options.stockcode);
        if (cninfo.options.stockcode.startsWith('6')) {
            urlret += util.format('sse&limit=');
        } else {
            urlret += util.format('szse&limit=');
        }
        return urlret;
    };



    return cninfo;
}

module.exports = createCninfoNewMain;