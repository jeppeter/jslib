/*jshint -W059 */
var tracer = require('tracer');
var util = require('util');
var fs = require('fs');

var _innerLogger = null;

var add_write_streams = function (self, arfiles, isappend) {
    'use strict';
    var openflags;
    openflags = 'w+';
    if (isappend) {
        openflags = 'a+';
    }
    arfiles.forEach(function (elm) {
        var ws;
        ws = fs.createWriteStream(elm, {
            flags: openflags,
            defaultEncoding: 'utf8',
            autoclose: true
        });
        ws.on('error', function (err) {
            var i;
            console.error('error on %s (%s)', elm, err);
            for (i = 0; i < self.writeStreams.length; i += 1) {
                if (self.writeStreams[i] === ws) {
                    self.writeStreams.splice(i, 1);
                    break;
                }
            }
        });
        ws.on('data', function (data) {
            if (!self.noconsole) {
                console.log('data (%s) %s', data, elm);
            }
        });
        ws.on('close', function () {
            if (!self.noconsole) {
                console.log('%s closed', elm);
            }
        });
        self.writeStreams.push(ws);
    });
};

var format_string = function () {
    'use strict';
    return util.format.apply(util, arguments);
};

function TraceLog(options) {
    'use strict';
    var self;
    self = this;
    this.level = 'error';
    this.writeStreams = [];
    this.waitStreams = [];
    this.stackindex = 1;
    this.noconsole = false;
    this.finish_need_counts = 0;
    this.finish_counts = 0;
    this.real_finish_callback = null;
    this.finish_callback = function (err) {
        self.finish_counts += 1;
        if (err) {
            if (self.real_finish_callback !== null) {
                self.real_finish_callback(err);
            }
        }
        if (self.finish_counts === self.finish_need_counts) {
            if (self.real_finish_callback !== null) {
                self.real_finish_callback(null);
            }
        }
        return;
    };
    this.finish = function (callback) {
        var ws;
        self.finish_need_counts = self.writeStreams.length;
        self.finish_counts = 0;
        self.real_finish_callback = callback || null;
        //var idx;
        while (self.writeStreams.length > 0) {
            ws = self.writeStreams[0];
            self.writeStreams.splice(0, 1);
            ws.end('', self.finish_callback);
        }

        if (self.finish_need_counts === 0 && callback !== null && callback !== undefined) {
            /*nothing to wait*/
            callback(null);
        }
    };
    this.format = "<{{title}}>:{{file}}:{{line}} {{message}}\n";
    if (typeof options.log_format === 'string' && options.log_format.length > 0) {
        this.format = options.log_format;
    }

    if (typeof options.level === 'string') {
        this.level = options.level;
    }

    if (util.isArray(options.log_files)) {
        add_write_streams(self, options.log_files, false);
    }

    if (util.isArray(options.log_appends)) {
        add_write_streams(self, options.log_appends, true);
    }

    if (typeof options.log_console === 'boolean' && !options.log_console) {
        this.noconsole = true;
    }


    this.innerLogger = tracer.console({
        format: [self.format],
        stackIndex: self.stackindex,
        transport: function (data) {
            if (!self.noconsole) {
                process.stderr.write(data.output);
            }
            self.writeStreams.forEach(function (elm) {
                elm.write(data.output);
            });
        }
    });

    tracer.setLevel(this.level);
    return this;

}

module.exports.Init = function (options) {
    'use strict';
    var inner_options;
    var oldinner = null;
    inner_options = options || {};
    oldinner = _innerLogger;
    _innerLogger = new TraceLog(inner_options);
    return oldinner;
};

module.exports.Set = function (logger) {
    'use strict';
    var oldinner = _innerLogger;
    if (logger === null || Array.isArray(logger.writeStreams)) {
        _innerLogger = oldinner;
    }
    return oldinner;
};

var inner_init = function (options) {
    'use strict';
    var inner_options = options || {};
    if (_innerLogger) {
        return _innerLogger;
    }
    _innerLogger = new TraceLog(inner_options);
    return null;
};


module.exports.debug = function () {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.debug(format_string.apply(format_string, arguments));
};


module.exports.trace = function () {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.trace(format_string.apply(format_string, arguments));
};

module.exports.info = function () {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.info(format_string.apply(format_string, arguments));
};

module.exports.warn = function () {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.warn(format_string.apply(format_string, arguments));
};

module.exports.error = function () {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.error(format_string.apply(format_string, arguments));
};

module.exports.finish = function (callback) {
    'use strict';
    if (_innerLogger !== null) {
        _innerLogger.finish(callback);
    } else {
        if (callback !== undefined && callback !== null) {
            callback(null);
        }
    }
    _innerLogger = null;
};

module.exports.init_args = function (commander) {
    'use strict';
    var tracelog_options = `
    {
        "+log" : {
            "appends" : [],
            "files" : [],
            "console" : true,
            "format" : "<{{title}}>:{{file}}:{{line}} {{message}}\\n"
        },
        "verbose|v" : "+"
    }
    `;
    commander.load_command_line_string(tracelog_options);
    return commander;
};

var set_attr_self_inner = function (self, args, prefix) {
    'use strict';
    var keys;
    var curkey;
    var i;
    var prefixnew;

    if (typeof prefix !== 'string' || prefix.length === 0) {
        throw new Error('not valid prefix');
    }

    prefixnew = util.format('%s_', prefix);
    prefixnew = prefixnew.toLowerCase();

    keys = Object.keys(args);
    for (i = 0; i < keys.length; i += 1) {
        curkey = keys[i];
        if (curkey.substring(0, prefixnew.length).toLowerCase() === prefixnew) {
            self[curkey] = args[curkey];
        }
    }

    return self;
};

module.exports.set_args = function (options) {
    'use strict';
    var logopt = {};
    if (options.verbose >= 4) {
        logopt.level = 'trace';
    } else if (options.verbose >= 3) {
        logopt.level = 'debug';
    } else if (options.verbose >= 2) {
        logopt.level = 'info';
    } else if (options.verbose >= 1) {
        logopt.level = 'warn';
    } else {
        logopt.level = 'error';
    }

    set_attr_self_inner(logopt, options, 'log');
    /*console.log('logopt (%s)', util.inspect(logopt, {
        showHidden: true,
        depth: null
    }));*/
    module.exports.Init(logopt);
    return;
};