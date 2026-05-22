var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var grab = grabwork();
var path = require('path');
var CryptoJS = require('crypto-js');
var fs = require('fs');


function createGgzjc(options) {
    'use strict';
    var ggzjc;
    var d;
    ggzjc = {};

    ggzjc.options = {};
    ggzjc.options.startdate = '2000-01-01';
    d = new Date();
    ggzjc.options.enddate = '';
    ggzjc.options.enddate += baseop.number_format_length(4, d.getFullYear());
    ggzjc.options.enddate += '-';
    ggzjc.options.enddate += baseop.number_format_length(2, d.getMonth() + 1);
    ggzjc.options.enddate += '-';
    ggzjc.options.enddate += baseop.number_format_length(2, d.getDate());
    ggzjc.options.maxcnt = 5;
    ggzjc.options.pagesize = 50;
    ggzjc.options.baselocate = '.';
    ggzjc.options.timeout = 5000;
    ggzjc.options.listoutput = null;
    ggzjc.options.listouthd = null;
    ggzjc.options.listinput = null;
    ggzjc.options.setindex = [];
    ggzjc.options.workindex = [];
    ggzjc.options.ggcmax = 10;
    ggzjc.options.getindex = 0;

    if (baseop.is_valid_date_ex(options.startdate)) {
        ggzjc.options.startdate = options.startdate;
    }

    if (baseop.is_valid_date_ex(options.enddate)) {
        ggzjc.options.enddate = options.enddate;
    }

    if (baseop.is_valid_string(options, 'topdir', 1)) {
        ggzjc.options.baselocate = options.topdir;
    }

    if (baseop.is_valid_number(options.timeout, false)) {
        ggzjc.options.timeout = options.timeout;
    }

    if (baseop.is_valid_string(options, 'listoutput', 1)) {
        ggzjc.options.listoutput = options.listoutput;
    }

    if (baseop.is_valid_string(options, 'listinput', 1)) {
        ggzjc.options.listinput = options.listinput;
    }

    if (baseop.is_valid_number(options.ggcmax,false)) {
        ggzjc.options.ggcmax = options.ggcmax;
    }



    ggzjc.post_next_error = function (err, worker, next) {
        jstracer.error('<GET::%s> error %s index', worker.url, err);
        worker.reqopt.ggzjc.trycnt += 1;
        if (worker.reqopt.ggzjc.trycnt < worker.reqopt.ggzjc.maxcnt) {
            var url;
            url = worker.url;
            worker.parent.queue(url, {
                reqopt: {
                    timeout: ggzjc.options.timeout
                },
                priority: grabwork.MIN_PRIORITY,
                ggzjc: worker.reqopt.ggzjc
            });
        }
        next(false, err);
        return;
    };


    ggzjc.filter_data =  function(data) {
        var retdata;
        const regdata = /[a-zA-Z_]+\(/i;
        retdata = data.replace(/^[a-zA-Z_]+\(/,"");
        retdata = retdata.replace(/[\);]+$/,"");
        return retdata;
    }

    ggzjc.post_handler = function (err, worker, next) {

        if (!baseop.is_non_null(worker.reqopt.ggzjc)) {
            next(true, err);
            return;
        }

        if (err) {
            /*we should query again*/
            ggzjc.post_next_error(err, worker, next);
            return;
        }
        /*to parse data*/
        try {

            var jsondata = ggzjc.filter_data(worker.htmldata);
            //jstracer.info('htmldata\n%s\njsondata\n%s', worker.htmldata,jsondata);
            var rdict = JSON.parse(jsondata);
            //console.log('rdict\n%s',rdict);
            if (baseop.is_non_null(rdict,'result') && baseop.is_non_null(rdict['result'],'data')) {
                var iname = util.format('%d.txt',worker.reqopt.ggzjc.index);
                while(iname.length < 9) {
                    iname = util.format('0%s',iname);
                }
                var tpath = path.join(ggzjc.options.baselocate,'ggzjc',iname);
                var wcon = JSON.stringify(rdict['result']);
                var wdata = Buffer.from(wcon,'utf8');
                //jstracer.trace('tpath\n%s\nwcon\n%s\nwdata %d',tpath,wcon,wdata.length);
                var tdirname = path.dirname(tpath);
                var curidx = worker.reqopt.ggzjc.index;
                var nidx = worker.reqopt.ggzjc.index;
                //jstracer.trace('curidx %d', curidx);
                baseop.mkdir_safe(tdirname,(err) => {
                    if (err) {
                        jstracer.error('can not create %s error %s', tdirname, err);
                        next(false,err);
                        return;
                    }
                    var cfile = fs.createWriteStream(tpath);
                    cfile.write(wdata);
                    cfile.close();
                    //jstracer.trace('pages %d', rdict['result']['pages']);
                    //jstracer.trace('index %d', curidx);
                    for(curidx = 0; curidx < rdict['result']['pages']; curidx += 1) {
                        ggzjc.post_url(curidx + 1);
                    }
                    //if (rdict['result']['pages'] > curidx) {
                    //    ggzjc.post_url(curidx + 1);                      
                    //}
                    /*to remove */
                    ggzjc.remove_workindex(nidx);
                    next(false,null);
                });
            }

        } catch (e) {
            jstracer.error('e %s', e);
            ggzjc.post_next_error(e, worker, next);
            return;
        }


        /*ok ,we should have this*/
        next(false, null);
        return;
    };

    ggzjc.remove_workindex = function(index) {
        ggzjc.options.workindex = ggzjc.options.workindex.filter(function(sidx){
            if (index !== sidx) {
                return true;
            }
            return false;
        });
        //jstracer.info('remove_workindex %d', index);
    };



    ggzjc.post_url = function(index) {
        //if (ggzjc.options.setindex < index) {
        if (!ggzjc.options.setindex.includes(index) && ggzjc.options.workindex.length < ggzjc.options.ggcmax ) {
            var url = util.format('https://datacenter-web.eastmoney.com/api/data/v1/get?callback=parse_data&reportName=RPT_EXECUTIVE_HOLD_DETAILS&columns=ALL&quoteColumns=&filter=&pageNumber=%d&pageSize=50&sortTypes=-1,1,1&sortColumns=CHANGE_DATE,SECURITY_CODE,PERSON_NAME&source=WEB&client=WEB&p=32&pageNo=32&pageNum=32&_=1773474776305',index);
            //jstracer.info('url\n%s', url);
            //jstracer.info('add %d workindex', index);
            var reqopt = {};
            reqopt.ggzjc = {};
            reqopt.ggzjc.trycnt = 0;
            reqopt.ggzjc.maxcnt = ggzjc.options.maxcnt;
            reqopt.ggzjc.index = index;
            grab.queue(url,reqopt);
            ggzjc.options.setindex.push(index);
            ggzjc.options.workindex.push(index);
            if ((ggzjc.options.setindex.length % 100) == 0) {
                jstracer.info('setindex %d', ggzjc.options.setindex.length);
            }
        }
        return;
    };



    return ggzjc;
}

module.exports = createGgzjc;