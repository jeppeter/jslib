var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('grabwork');
var grab = grabwork();


function createCninfoNewQuery(options) {
	'use strict';
	var queryinfo;
	var selfquery;
	var d;
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

	if (!baseop.is_non_null(queryinfo.options.typeex)) {
		if (queryinfo.options.stockcode.startsWith('6')) {
			queryinfo.options.typeex = 'sse';
		} else {
			queryinfo.options.typeex = 'szse';
		}
	}

	if (!baseop.is_non_null(queryinfo.options.plate)) {
		if (queryinfo.options.stockcode.startsWith('6')) {
			queryinfo.options.plate = 'sh';
		} else {
			queryinfo.options.plate = 'sz';
		}
	}

	queryinfo.options.trycnt = 0;
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

	selfquery.next_post_queue(worker, next) {
		var reqopt = {};
		var postdata ;
		var urlret;
		
		postdata = selfquery.format_post_data(worker.reqopt.queryinfo,true);
		urlret = selfquery.format_url();
		reqopt = {};
		reqopt.reqopt = {};
		reqopt.reqopt.postData = postdata ;
		reqopt.reqopt.headers = [{
			name: 'Content-Type' ,
			value: 'application/x-www-form-urlencoded; charset=UTF-8'
		}];
		worker.reqopt.queryinfo.trycnt = 0;
		reqopt.queryinfo = worker.reqopt.queryinfo;
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
			reqopt.reqopt = {};
			reqopt.reqopt.postData = postdata ;
			reqopt.reqopt.headers = [{
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
		if (!baseop.is_non_null(worker.reqopt['queryinfo'])) {
			next(true,err);
			return;
		}

		/*now it is the query to give the data*/
		if (baseop.is_non_null(err)) {
			/*to format the url*/
			selfquery.try_again_queue(err,worker,next);
			return;
		}

		/*now to get all read count*/
		totalnum = worker.reqopt.queryinfo.pagenum * worker.reqopt.queryinfo.pagesize;
		if (totalnum < worker.reqopt.queryinfo.totalnum) {
			selfquery.next_post_queue(worker,next);
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

		}
		catch(e) {
			selfquery.try_again_queue(e, worker,next);
			return;
		}
	};

	return queryinfo;
}

module.exports = createCninfoNewQuery;