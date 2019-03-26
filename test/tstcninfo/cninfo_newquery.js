var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('grabwork');


function createCninfoNewQuery(options) {
	'use strict';
	var queryinfo;
	var selfquery;
	var d;
	queryinfo = {};
	selfquery = {};
	queryinfo.options = options || {};
	if (!baseop.is_non_null(queryinfo.options.stockcode)) {
		queryinfo.options.stockcode = '600000';
	}
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

	if (!baseop.is_non_null(queryinfo.options.orgid)) {
		queryinfo.options.orgid='0000000000';
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

	selfquery.format_post_data = function(isnext) {
		var postdata = '';
		if (isnext) {
			queryinfo.options.pagenum += 1;
		}
		postdata += util.format('pageNum=%s', queryinfo.options.pagenum);
		postdata += util.format('&pageSize=%s', queryinfo.options.pagesize);
		postdata += util.format('&tabName=fulltext');
		postdata += util.format('&column=%s', queryinfo.options.typeex);
		postdata += util.format('&sotck=%s', queryinfo.options.stockcode);
		postdata += util.format('%%2C%s', queryinfo.options.orgid);
		postdata += util.format('&searchkey=');
		postdata += util.format('&secid=');
		postdata += util.format('&plate=%s', queryinfo.options.plate);
		postdata += util.format('&category=');
		postdata += util.format('&seDate=%s+~+%s', queryinfo.options.startdate , queryinfo.options.enddate);
		
		jstracer.trace('postdata [%s]', postdata);
		return postdata;
	};

	selfquery.next_post_queue(worker, next) {
		var reqopt = {};
		var postdata ;
		var urlret;
		queryinfo.options.trycnt = 0;
		postdata = selfquery.format_post_data(false);
		urlret = selfquery.format_url();
		reqopt = {};
		reqopt.reqopt = {};
		reqopt.reqopt.postData = postdata ;
		reqopt.reqopt.headers = [{
			name: 'Content-Type' ,
			value: 'application/x-www-form-urlencoded; charset=UTF-8'
		}];
		reqopt.queryinfo = queryinfo;
		worker.post_queue(urlret, reqopt);
		next(false,null);
		return;
	};

	selfquery.try_again_queue = function(err, worker, next) {
		var reqopt = {};
		var postdata ;
		var urlret;
		queryinfo.options.trycnt += 1;
		if (queryinfo.options.trycnt < queryinfo.options.maxcnt) {
			postdata = selfquery.format_post_data(false);
			urlret = selfquery.format_url();
			reqopt = {};
			reqopt.reqopt = {};
			reqopt.reqopt.postData = postdata ;
			reqopt.reqopt.headers = [{
				name: 'Content-Type' ,
				value: 'application/x-www-form-urlencoded; charset=UTF-8'
			}];
			reqopt.queryinfo = queryinfo;
			worker.post_queue(urlret, reqopt);
		}
		next(false,err);
		return;
	}


	queryinfo.post_handleer = function(err, worker, next) {
		var postdate;
		var urlret;
		var reqopt;
		if (!baseop.is_non_null(worker.reqopt['queryinfo'])) {
			next(true,err);
			return;
		}

		/*now it is the query to give the data*/
		if (baseop.is_non_null(err)) {
			/*to format the url*/
			queryinfo.options.trycnt += 1;
			if (queryinfo.options.trycnt < queryinfo.options.maxcnt) {
				postdata = selfquery.format_post_data(false);
				urlret = selfquery.format_url();
			}

			next(false,err);
			return;
		}
	};

	return queryinfo;
}

module.exports = createCninfoNewQuery;