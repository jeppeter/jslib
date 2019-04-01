var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var grab = grabwork();
var path = require('path');


var get_num_with_url = function(s) {
	var arr;
	var sa;
	arr = s.split('/');
	if (arr.Length < 3) {
		return '';
	}

	sa = arr[1];
	arr = sa.split('-');
	if (arr.Length < 3) {
		return '';
	}
	return arr[0];
};

var load_query_info = null;


function createCninfoNewQuery(options) {
	'use strict';
	var queryinfo;
	var selfquery;
	var d;

	if (load_query_info != null) {
		return load_query_info;
	}

	queryinfo = {};
	selfquery = {};
	queryinfo.options = options || {};
	if (!baseop.is_non_null(queryinfo.options.pagenum)) {
		queryinfo.options.pagenum = 1;
	}

	if (!baseop.is_non_null(queryinfo.options.startdate)) {
		queryinfo.options.startdate = '2000-01-01';
	}

	if (!baseop.is_non_null(queryinfo.options.enddate)) {
		d = new Date();
		queryinfo.options.enddate = util.format('%s-%s-%s',baseop.number_format_length(4, d.getFullYear()),
			baseop.number_format_length(2, d.getMonth() + 1),
			baseop.number_format_length(2, d.getDate())) ;
	}

	if (!baseop.is_non_null(queryinfo.options.pagesize)) {
		queryinfo.options.pagesize = 30;
	}

	if (!baseop.is_non_null(queryinfo.options.topdir)) {
		queryinfo.options.topdir = __dirname;
	}


	if (!baseop.is_non_null(queryinfo.options.maxcnt)) {
		queryinfo.options.maxcnt = 5;
	}

	selfquery.format_url = function() {
		var urlret = '';
		urlret = 'http://www.cninfo.com.cn/new/hisAnnouncement/query';
		return urlret;
	};

	selfquery.format_post_data = function(qinfo,isnext) {
		var postdata = '';
		if (isnext) {
			qinfo.pagenum += 1;
		}
		postdata += util.format('pageNum=%s', qinfo.pagenum);
		postdata += util.format('&pageSize=%s', qinfo.pagesize);
		postdata += util.format('&tabName=fulltext');
		postdata += util.format('&column=%s', qinfo.typeex);
		postdata += util.format('&sotck=%s', qinfo.stockcode);
		postdata += util.format('%%2C%s', qinfo.orgid);
		postdata += util.format('&searchkey=');
		postdata += util.format('&secid=');
		postdata += util.format('&plate=%s', qinfo.plate);
		postdata += util.format('&category=');
		postdata += util.format('&seDate=%s+~+%s', qinfo.startdate , qinfo.enddate);
		
		jstracer.trace('postdata [%s]', postdata);
		return postdata;
	};

	selfquery.next_post_queue = function(worker, next) {
		var reqopt = {};
		var postdata ;
		var urlret;
		
		postdata = selfquery.format_post_data(worker.reqopt.queryinfo,true);
		urlret = selfquery.format_url();
		reqopt = {};
		reqopt.postData = postdata ;
		reqopt.headers = [{
			name: 'Content-Type' ,
			value: 'application/x-www-form-urlencoded; charset=UTF-8'
		}];
		reqopt.queryinfo = worker.reqopt.queryinfo;
		reqopt.queryinfo.trycnt = 0;
		worker.post_queue(urlret, reqopt);
		next(false,null);
		return;
	};

	selfquery.try_again_queue = function(err, worker, next) {
		var reqopt = {};
		var postdata ;
		var urlret;
		worker.reqopt.queryinfo.trycnt += 1;
		if (worker.reqopt.queryinfo.trycnt < worker.reqopt.queryinfo.maxcnt) {
			postdata = selfquery.format_post_data(worker.reqopt.queryinfo,false);
			urlret = selfquery.format_url();
			reqopt = {};
			reqopt.postData = postdata ;
			reqopt.headers = [{
				name: 'Content-Type' ,
				value: 'application/x-www-form-urlencoded; charset=UTF-8'
			}];
			reqopt.queryinfo = worker.reqopt.queryinfo;
			worker.post_queue(urlret, reqopt);
		}
		next(false,err);
		return;
	}


	queryinfo.post_handleer = function(err, worker, next) {
		var postdate;
		var urlret;
		var reqopt;
		var totalnum;
		var gettotalnum;
		if (!baseop.is_non_null(worker.reqopt['queryinfo'])) {
			next(true,err);
			return;
		}

		jstracer.trace('get [%s]', worker.htmldata);

		/*now it is the query to give the data*/
		if (baseop.is_non_null(err)) {
			/*to format the url*/
			selfquery.try_again_queue(err,worker,next);
			return;
		}


		/*now to give the download */
		try {
			var jdata;
			var arr;
			jstracer.trace('query info %s', worker.htmldata);
			jdata = JSON.parse(worker.htmldata);
			if (!baseop.is_non_null(jdata['announcements'])) {
				selfquery.try_again_queue(new Error('no announcements'), worker,next);
				return;
			}

			arr = jdata['announcements'];
			if (! Array.isArray(arr)) {
				selfquery.try_again_queue(new Error('announcements not array type'), worker,next);
				return;
			}

			gettotalnum = 0;
			if (!baseop.is_non_null(jdata['totalAnnouncement'])) {
				jstracer.warn('no totalAnnouncement');
			} else {
				gettotalnum = jdata['totalAnnouncement'];
			}

			arr.forEach(function(elm,idx) {
				var annid;
				var anntitle;
				var downfile;
				var sfix;
				var durl;
				var yearnum;
				jstracer.trace('[%s] %s', idx, elm);
				if (!baseop.is_non_null(elm['adjunctUrl'])) {
					jstracer.error('[%s] element not adjunctUrl', idx);
					return;					
				}

				if (! baseop.is_non_null(elm['announcementTitle'])) {
					jstracer.error('[%s] element not announcementTitle', idx);
					return;
				}
				if (!baseop.is_non_null(elm['announcementId'])) {
					jstracer.error('[%s] element not announcementId', idx);
					return;
				}

				sfix = path.extname(elm['adjunctUrl']);

				annid = elm['announcementId'];
				anntitle = elm['announcementTitle'];
				downfile = util.format('%s_%s.%s', annid,anntitle, sfix);

				durl = util.format('http://static.cninfo.com.cn/%s', elm['adjunctUrl']);
				reqopt = {};
				reqopt.downloadoption = {};
				yearnum = get_num_with_url(elm['adjunctUrl']);
				reqopt.downloadoption.downloadfile = path.join(queryinfo.options.topdir,worker.reqopt.queryinfo.stockcode,yearnum,downfile);
				jstracer.trace('download %s', durl);
				grab.download_queue(durl, reqopt);
			}) ;

		}
		catch(e) {
			selfquery.try_again_queue(e, worker,next);
			return;
		}

		/*now to get all read count*/
		totalnum = worker.reqopt.queryinfo.pagenum * worker.reqopt.queryinfo.pagesize;
		if (totalnum < gettotalnum) {
			selfquery.next_post_queue(worker,next);
			return;
		} else {
			jstracer.trace('no more %s <= %s', gettotalnum, totalnum);
		}
		next(false,null);
		return;
	};

	queryinfo.add_stock = function(stockcode,orgid) {
		var reqopt;
		var postdata ;
		var urlret;
		reqopt = {};
		reqopt.queryinfo = {};
		reqopt.queryinfo.stockcode = stockcode;
		reqopt.queryinfo.topdir = queryinfo.options.topdir;
		reqopt.queryinfo.startdate = queryinfo.options.startdate;
		reqopt.queryinfo.enddate = queryinfo.options.enddate;
		reqopt.queryinfo.pagesize = queryinfo.options.pagesize;
		reqopt.queryinfo.pagenum = queryinfo.options.pagenum;
		reqopt.queryinfo.orgid = orgid;
		reqopt.queryinfo.maxcnt = queryinfo.options.maxcnt;
		reqopt.queryinfo.trycnt = 0;
		if (stockcode.startsWith('6')) {
			reqopt.queryinfo.typeex = 'sse';
		} else {
			reqopt.queryinfo.typeex = 'szse';
		}

		if (stockcode.startsWith('6')) {
			reqopt.queryinfo.plate = 'sh';
		} else {
			reqopt.queryinfo.plate = 'sz';
		}

		
		postdata = selfquery.format_post_data(reqopt.queryinfo,false);
		urlret = selfquery.format_url();
		reqopt.postData = postdata ;
		reqopt.headers = [{
			name: 'Content-Type' ,
			value: 'application/x-www-form-urlencoded'
		}];
		jstracer.trace('post [%s] postdata [%s]', urlret, reqopt.postData);
		grab.post_queue(urlret, reqopt);
		return;
	};

	load_query_info = queryinfo;

	return queryinfo;
}


module.exports = createCninfoNewQuery;
