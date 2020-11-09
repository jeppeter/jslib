var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var grab = grabwork();
var path = require('path');



function createCninfoNewMain(options) {
    'use strict';
    var cninfo;
    var d;
    cninfo = {};

    cninfo.options = {};
    cninfo.options.startdate = '2000-01-01';
    d = new Date();
    cninfo.options.enddate = '';
    cninfo.options.enddate += baseop.number_format_length(4, d.getFullYear());
    cninfo.options.enddate += '-'
    cninfo.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    cninfo.options.enddate += '-'
    cninfo.options.enddate += baseop.number_format_length(2, d.getDate());
    cninfo.options.maxcnt = 5;
    cninfo.options.pagesize = 30;
    cninfo.options.baselocate = '.';

    if (baseop.is_valid_date_ex(options.startdate)) {
        cninfo.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date_ex(options.enddate)) {
        cninfo.options.enddate = options.enddate;
    }

    if (baseop.is_valid_string(options,'topdir',1)) {
        cninfo.options.baselocate = options.topdir;
    }



    cninfo.post_next_error = function(err, worker, next) {
        jstracer.error('<GET::%s> error %s', worker.url, err);
        worker.reqopt.cninfomain.trycnt += 1;
        if (worker.reqopt.cninfomain.trycnt < worker.reqopt.cninfomain.maxcnt) {
            var bodydata;
            bodydata = cninfo.format_url(worker.reqopt.cninfo.stockcode,worker.reqopt.cninfomain.orgid,worker.reqopt.cninfomain.pagenum);
            worker.parent.post_queue(worker.url, {
                priority: grabwork.MIN_PRIORITY,
                cninfomain: worker.reqopt.cninfomain,
                });
        }
        next(false, err);
        return;
    };

    cninfo.post_handler = function (err, worker, next) {
        var jdata;


        if (!baseop.is_non_null(worker.reqopt['cninfomain'])) {
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
            //jstracer.trace('htmldata %s', worker.htmldata);
            jdata = JSON.parse(worker.htmldata);
            if (!baseop.is_non_null(jdata['announcements'])) {
                cninfo.post_next_error(new Error('no announcements'),worker,next);
                return;
            }

            arr = jdata['announcements'];
            if (! Array.isArray(arr)) {
                cninfo.post_next_error(new Error('announcements not array type'), worker, next);
                return;
            }

            arr.forEach(function(elm,idx) {
                'use strict';
                var fname;
                var downloadurl;
                var yearnum='2020';
                var pathext;
                var sarr;
                var downreqopt = {};
                var ok = true;
                if (!baseop.is_non_null(elm['announcementTitle'])) {
                    jstracer.warn('[%s] %s no announcementTitle',idx , util.inspect(elm,{showHidden: True}));
                    ok = false;
                }
                if (ok && !baseop.is_non_null(elm['adjunctUrl'])) {
                    jstracer.warn('[%s] %s no adjunctUrl', idx, util.inspect(elm,{showHidden: True}));
                    ok = false;
                }

                if ( ok && !baseop.is_non_null(elm['announcementId'])) {
                    jstracer.warn('[%s] %s no announcementId', idx, util.inspect(elm,{showHidden: True}));
                    ok = false;
                }

                if (ok) {
                    downloadurl = util.format('http://static.cninfo.com.cn/%s',elm['adjunctUrl']);
                    pathext = path.extname(downloadurl);
                    sarr = elm['adjunctUrl'].split('/');
                    if (sarr.length > 0) {
                        sarr = sarr[1].split('-');
                        if (sarr.length > 0) {
                            yearnum = sarr[0];
                        }
                    }
                    fname = path.join(cninfo.options.baselocate,worker.reqopt['cninfomain'].stockcode, yearnum,util.format('%s_%s%s',elm['announcementId'],elm['announcementTitle'],pathext));
                    fname = fname.replace(/\</g,'_');
                    fname = fname.replace(/\>/g,'_');
                    fname = fname.replace(/\(/g,'_');
                    fname = fname.replace(/\)/g,'_');
                    fname = fname.replace(/ /g,'_');
                    fname = fname.replace(/\*/g,'_');
                    fname = fname.replace(/\"/g,'_');
                    fname = fname.replace(/\'/g,'_');
                    downreqopt.downloadoption = {};
                    downreqopt.downloadoption.downloadfile = fname;
                    //jstracer.trace('download [%s] => [%s]', downloadurl, fname);
                    grab.download_queue(downloadurl,downreqopt);                    
                }
            });

            if (baseop.is_non_null(jdata['totalpages'])) {
                if (worker.reqopt.cninfomain.pagenum < jdata['totalpages']) {
                    'use strict';
                    var bodydata;
                    var pagenumset =  worker.reqopt.cninfomain.pagenum + 1; 
                    bodydata = cninfo.format_url(worker.reqopt.cninfomain.stockcode, 
                            worker.reqopt.cninfomain.orgid,
                            pagenumset);
                    grab.post_queue('http://www.cninfo.com.cn/new/hisAnnouncement/query', {
                        reqopt :  {
                            body : bodydata,
                            headers : {
                                "Content-Type" : "application/x-www-form-urlencoded"
                            }
                        },
                        cninfomain: {
                            stockcode: worker.reqopt.cninfomain.stockcode,
                            orgid : worker.reqopt.cninfomain.orgid,
                            enddate: cninfo.options.enddate,
                            startdate: cninfo.options.startdate,
                            trycnt: 0,
                            maxcnt: cninfo.options.maxcnt,
                            pagenum: pagenumset
                        }
                    });
                }
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

    cninfo.format_url = function(stockcode,orgId,pagenum) {
        'use strict';
        var bodydata;

        bodydata = '';
        bodydata += util.format('stock=%s', stockcode);
        bodydata += '%2C';
        bodydata += util.format('%s',orgId);
        bodydata += util.format('&tabName=fulltext&pageSize=%s', cninfo.options.pagesize);
        bodydata += util.format('&pageNum=%s',pagenum);
        if (stockcode.startsWith('6')) {
            bodydata += '&column=sse&category=&plate=sh';
        } else {
            bodydata += '&column=szse&category=&plate=sz';
        }

        bodydata += util.format('&seDate=%s~%s',cninfo.options.startdate,cninfo.options.enddate);
        bodydata += '&searchkey=&secid=&sortName=&sortType=&isHLtitle=true';
        jstracer.trace('bodydata [%s]',bodydata);

        return bodydata;
    };

    cninfo.post_queue_url = function(stockcode,orgId,name) {
        var bodydata;
        bodydata = cninfo.format_url(stockcode,orgId,1);
        grab.post_queue('http://www.cninfo.com.cn/new/hisAnnouncement/query', {
            reqopt :  {
                body : bodydata,
                headers : {
                    "Content-Type" : "application/x-www-form-urlencoded"
                }
            },
            cninfomain: {
                stockcode: stockcode,
                orgid : orgId,
                enddate: cninfo.options.enddate,
                startdate: cninfo.options.startdate,
                trycnt: 0,
                maxcnt: cninfo.options.maxcnt,
                pagenum: 1
            }
        });
    };

    return cninfo;
}

module.exports = createCninfoNewMain;