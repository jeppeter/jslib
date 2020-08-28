var jstracer = require('jstracer');
var baseop = require('../../baseop');
var util = require('util');
var grabwork = require('../../grabwork');
var grab = grabwork();


function createStockCode(maxcnt,callback) {
	var coderet;

	coderet = {};
	coderet.options = {};
	coderet.options.callback = callback;
	coderet.options.maxcnt = maxcnt;

	coderet.post_handler_err = function(err, worker,next) {
		jstracer.error('<GET::%s> error %s', worker.url, err);
		worker.reqopt.stockcode.tries += 1;
		if (worker.reqopt.stockcode.tries < worker.reqopt.stockcode.maxcnt) {
			worker.parent.queue(worker.url, {
				priority: grabwork.MIN_PRIORITY,
				stockcode : worker.reqopt.stockcode,
			})
		}
		next(false,err);
		return;
	};

	coderet.post_handler = function(err, worker,next) {
		if (!baseop.is_non_null(worker.reqopt['stockcode'])) {
			next(true,err);
			return;
		}

		if (err) {
			coderet.post_handler_err(err, worker,next);
			return;
		}

		try{
			worker.reqopt.stockcode.callback(worker.htmldata);
		}
		catch(e) {
			coderet.post_handler_err(e,worker, next);
			return;
		}
		next(false,null);
		return;
	};

	coderet.get_code = function() {
		grab.queue('http://www.cninfo.com.cn/new/data/szse_stock.json',{
			priority: grabwork.MIN_PRIORITY,
			stockcode :  {
				callback : coderet.options.callback,
				tries : 0,
				maxcnt : coderet.options.maxcnt
			},
		});
	};

	return coderet;
}

module.exports = createStockCode;