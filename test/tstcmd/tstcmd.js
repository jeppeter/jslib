var extargsparse = require('../../extargsparse');
var util = require('util');
var tracelog = require('../../tracelog');
var baseop = require('../../baseop');
var parser;
var URL = require('url');
var command_line = `
    {
        "mkdir<mkdir_command>## dirs... : to make directory ##" : {
            "$" : "+"
        },
        "testroot<testroot_command>## dirs... : to test if root ##" : {
            "$" : "+"
        },
        "validdate<validdate_command>## date : to validate the date ##" : {
            "$" : 1
        },
        "validnum<validnum_command>## num : to validate the num ##" : {
            "$" : 1,
            "is16" : false
        },
        "parsenum<parsenum_command>## num : to parse num ##" : {
            "$" : 1
        },
        "readjson<readjson_command>## jsonfile : to read ##" : {
            "$" : 1
        },
        "datesplit<datesplit_command>## startdate enddate : to split date for year ##" : {
            "$" : 2
        },
        "jsonparse<jsonparse_command>## jsonfile values... : to get values in jsonfile ##" : {
            "$" : "+"
        },
        "jsonarray<jsonarray_command>## jsonfile [value] :  to get values in jsonfile as array ##" : {
            "$" : "+"
        },
        "getannounce<getannounce_command>## htmlfile : to get announcements ##" : {
            "$" : 1
        },
        "testdownloadfile<testdownloadfile_command>## : to test download file ##" : {
            "$" : 0
        },
        "parseurl<parseurl_command>## urls : to parse url ##" :{
            "$" : "+"
        }
    }
`;


var trace_exit = function (ec) {
    'use strict';
    tracelog.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};

parser = extargsparse.ExtArgsParse({
    help_func: function (ec, s) {
        'use strict';
        var fp;
        if (ec === 0) {
            fp = process.stdout;
        } else {
            fp = process.stderr;
        }
        fp.write(s);
    }
});

parser.load_command_line_string(command_line);


process.on('SIGINT', function () {
    'use strict';
    tracelog.warn('caught sig int');
    trace_exit(0);
    return;
});

process.on('uncaughtException', function (err) {
    'use struct';
    tracelog.error('error (%s) (%s)', err, err.stack);
    trace_exit(3);
    return;
});

var mkdir_command = function (args) {
    'use strict';
    var errcode = 0;
    tracelog.set_args(args);

    args.subnargs.forEach(function (elm, idx) {
        baseop.mkdir_safe(elm, function (err) {
            if (err) {
                tracelog.error('[%d](%s) error(%s)', idx, elm, err);
                errcode = 3;
                if (idx === (args.subnargs.length - 1)) {
                    trace_exit(errcode);
                }
                return;
            }
            tracelog.info('[%d](%s) succ', idx, elm);
            if (idx === (args.subnargs.length - 1)) {
                trace_exit(errcode);
            }
            return;
        });
    });
    return;
};

exports.mkdir_command = mkdir_command;

var testroot_command = function (args) {
    'use strict';
    tracelog.set_args(args);

    args.subnargs.forEach(function (elm, idx) {
        var isroot;
        isroot = baseop.is_root(elm);
        if (isroot) {
            console.log('[%d] (%s) is root', idx, elm);
        } else {
            console.log('[%d] (%s) is not root', idx, elm);
        }
        if (idx === (args.subnargs.length - 1)) {
            trace_exit(0);
        }
        return;
    });
    return;
};

exports.testroot_command = testroot_command;

var validdate_command = function (args) {
    'use strict';
    var errcode = 0;
    var datestr = args.subnargs[0];
    tracelog.set_args(args);
    if (baseop.is_valid_date(datestr)) {
        console.log('<%s> is valid date', datestr);
    } else {
        console.error('<%s> is not valid date', datestr);
        errcode = 3;
    }
    trace_exit(errcode);
    return;
};

exports.validdate_command = validdate_command;

var validnum_command = function (args) {
    'use strict';
    var errcode = 0;
    var numstr = args.subnargs[0];
    tracelog.set_args(args);
    if (baseop.is_valid_number(numstr, args.validnum_is16)) {
        console.log('<%s> is valid number', numstr);
    } else {
        console.error('<%s> is not valid number', numstr);
        errcode = 3;
    }
    trace_exit(errcode);
    return;
};

exports.validnum_command = validnum_command;

var parsenum_command = function (args) {
    'use strict';
    var errcode = 0;
    var num;
    var numstr = args.subnargs[0];
    tracelog.set_args(args);
    num = baseop.parse_number(numstr);
    if (!isNaN(num)) {
        if (baseop.is_valid_float(numstr)) {
            console.log('<%s> number %s', numstr, num);
        } else {
            console.log('<%s> number %d', numstr, num);
        }
    } else {
        console.error('<%s> not valid number', numstr);
    }
    trace_exit(errcode);
    return;
};

exports.parsenum_command = parsenum_command;

var readjson_command = function (args) {
    'use strict';
    var jsonfile = args.subnargs[0];
    tracelog.set_args(args);
    baseop.read_json_parse(jsonfile, function (err, opt) {
        if (err) {
            console.error('read (%s) error(%s)', jsonfile, JSON.stringify(err));
            trace_exit(3);
            return;
        }

        console.log('<%s> (%s)', jsonfile, util.inspect(opt, {
            showHidden: true,
            depth: null
        }));
        trace_exit(0);
        return;
    });
    return;
};

exports.readjson_command = readjson_command;

var datesplit_command = function (args) {
    'use strict';
    var yeardate;
    var startdate = args.subnargs[0];
    var enddate = args.subnargs[1];
    tracelog.set_args(args);
    yeardate = baseop.split_by_oneyear(startdate, enddate);
    tracelog.info('get date (%s) (%s) (%d)', startdate, enddate, yeardate.length);
    yeardate.forEach(function (elm, idx) {
        console.log('[%d] %s %s', idx, elm.startdate, elm.enddate);
    });
    trace_exit(0);
    return;
};

exports.datesplit_command = datesplit_command;

var jsonparse_command = function (args) {
    'use strict';
    var jsonfile = args.subnargs[0];
    var values = null;

    if (args.subnargs.length > 1) {
        values = args.subnargs.slice(1, args.subnargs.length - 1);
    }
    tracelog.set_args(args);
    baseop.read_json_parse(jsonfile, function (err, opt) {
        if (err) {
            console.error('can not read(%s) error(%s)', jsonfile, JSON.stringify(err));
            trace_exit(3);
            return;
        }

        if (baseop.is_non_null(values) && values.length > 0) {
            values.forEach(function (elm, idx) {
                if (baseop.is_non_null(opt, elm)) {
                    console.log('[%d]%s = %s', idx, elm, opt[elm]);
                } else {
                    console.error('[%d]%s not defined', idx, elm);
                }
            });
        } else {
            console.log('%s (%s)', jsonfile, util.inspect(opt, {
                showHidden: true,
                depth: null
            }));
        }
        trace_exit(0);
        return;
    });
};

exports.jsonparse_command = jsonparse_command;

var jsonarray_command = function (args) {
    'use strict';
    var idx;
    var jsonfile = args.subnargs[0];
    var value = null;
    if (args.subnargs.length > 1) {
        value = parseInt(args.subnargs[1]);
    }
    idx = args.jsonarray_num;
    tracelog.set_args(args);
    baseop.read_json_parse(jsonfile, function (err, opt) {
        if (err) {
            console.error('can not read(%s) error(%s)', jsonfile, JSON.stringify(err));
            trace_exit(3);
            return;
        }

        if (value !== null && value !== undefined) {

            if (baseop.is_non_null(opt, value)) {
                console.log('%s[%d] = %s', value, idx, util.inspect(opt[value][args.jsonarray_num], {
                    showHidden: true,
                    depth: null
                }));
            } else {
                console.error('%s not defined', value);
            }
        } else {
            console.log('%s (%s)', jsonfile, util.inspect(opt, {
                showHidden: true,
                depth: null
            }));
        }
        trace_exit(0);
        return;
    });
};

exports.jsonarray_command = jsonarray_command;

var get_annoucement = function (opt) {
    'use strict';
    var retval = {};
    var i;
    var curelm;
    var curpdf;

    if (!baseop.is_non_null(opt, 'announcements')) {
        tracelog.error('can not get classifiedAnnouncements');
        return null;
    }

    if (!baseop.is_non_null(opt, 'totalAnnouncement')) {
        tracelog.error('can not get totalAnnouncement');
        return null;
    }

    if (!baseop.is_non_null(opt, 'totalRecordNum')) {
        tracelog.error('can not get totalRecordNum');
        return null;
    }

    retval.totalAnnouncement = opt.totalAnnouncement;
    retval.totalRecordNum = opt.totalRecordNum;
    retval.pdfs = [];

    if (opt.announcements.length > 0) {
        for (i = 0; i < opt.announcements.length; i += 1) {
            curelm = opt.announcements[i];
            if (!baseop.is_non_null(curelm, 'adjunctUrl')) {
                tracelog.warn('[%d] no adjunctUrl', i);
            } else {
                curpdf = {};
                curpdf.adjunctUrl = curelm.adjunctUrl;
                retval.pdfs.push(curpdf);
            }
        }
    }


    return retval;
};

var getannounce_command = function (args) {
    'use strict';
    var jsonfile = args.subnargs[0];
    tracelog.set_args(args);
    baseop.read_json_parse(jsonfile, function (err, opt) {
        var retlists;
        if (err) {
            console.error('can not read(%s) error(%s)', jsonfile, JSON.stringify(err));
            trace_exit(3);
            return;
        }

        retlists = get_annoucement(opt);
        if (retlists === null) {
            console.error('can not get announcement');
            trace_exit(3);
            return;
        }

        retlists.pdfs.forEach(function (elm, idx) {
            console.log('[%d] pdfs (%s)', idx, elm.adjunctUrl);
        });

        trace_exit(0);
        return;
    });
};

exports.getannounce_command = getannounce_command;


var download_file = function (url, dirname, opt) {
    'use strict';
    var url2, dir2, opt2;
    url2 = '';
    dir2 = '';
    opt2 = {};
    console.log('url type(%s) dirname (%s) opt (%s)', typeof url, typeof dirname, typeof opt);
    if (baseop.is_non_null(opt)) {
        url2 = url;
        dir2 = dirname;
        opt2 = opt;
    } else if (baseop.is_non_null(dirname)) {
        if (typeof dirname === 'string') {
            url2 = url;
            dir2 = dirname;
        } else {
            if (baseop.is_url_format(url)) {
                url2 = url;
                opt2 = dirname;
            } else {
                url2 = url;
                dir2 = dirname;
            }
        }
    } else {
        if (typeof url === 'string') {
            if (baseop.is_url_format(url)) {
                url2 = url;
            } else {
                dir2 = url;
            }
        } else {
            opt2 = url;
        }
    }
    console.log('url (%s) dirname (%s) opt (%s)', url2, dir2, opt2);
    return;
};

var testdownloadfile_command = function (args) {
    'use strict';
    var url = 'https://download.com/download.pdf';
    var dirname = __dirname;
    var opt = {};
    opt.reqopt = {};
    opt.reqopt.url = url;
    tracelog.set_args(args);
    download_file(url, dirname);
    download_file(url, opt);
    download_file(dirname, opt);
    download_file(url, dirname, opt);
    download_file(dirname);
    download_file(url);
    download_file(opt);
    trace_exit(0);
};

exports.testdownloadfile_command = testdownloadfile_command;


var parseurl_command = function (args, parser) {
    'use strict';
    tracelog.set_args(args);
    parser = parser;
    args.subnargs.forEach(function (elm) {
        var urlparse;
        urlparse = URL.parse(elm);
        tracelog.info('protocol (%s)', urlparse.protocol);
        tracelog.info('auth (%s)', urlparse.auth);
        tracelog.info('host (%s)', urlparse.host);
        tracelog.info('path (%s)', urlparse.path);
        tracelog.info('hash (%s)', urlparse.hash);
    });
    return;
};

exports.parseurl_command = parseurl_command;

tracelog.init_args(parser);
parser.parse_command_line();