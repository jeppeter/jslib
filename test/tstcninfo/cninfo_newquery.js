var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('grabwork');


function createCninfoNewQuery(options) {
	'use strict';
	var queryinfo;
	queryinfo = {};
	queryinfo.options = options || {};
	queryinfo.options.stockcode = '600000';
	if (baseop.is_non_null(options['stockcode'])) {
		queryinfo.options.stockcode = options.stockcode;
	}
	queryinfo.options.pagenum = 30;
	if (baseop.is_non_null(options['pagenum'])) {
		queryinfo.options.pagenum = options.pagenum;
	}

	queryinfo.post_handleer = function() {

	};

	return queryinfo;
}

module.exports = createCninfoNewQuery;