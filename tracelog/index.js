var tracer = require('tracer');
var util = require('util');
var fs = require('fs');

var _innerLogger;

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
        self.real_finish_callback = callback;
        //var idx;
        while (self.writeStreams.length > 0) {
            ws = self.writeStreams[0];
            self.writeStreams.splice(0, 1);
            ws.end('', self.finish_callback);
        }

        if (self.finish_need_counts === 0) {
            /*nothing to wait*/
            callback(null);
        }
    };
    this.format = "<{{title}}>:{{file}}:{{line}} {{message}}\n";
    if (typeof options.format === 'string' && options.format.length > 0) {
        this.format = options.format;
    }

    if (typeof options.level === 'string') {
        this.level = options.level;
    }

    if (util.isArray(options.files)) {
        add_write_streams(self, options.files, false);
    }

    if (util.isArray(options.appendfiles)) {
        add_write_streams(self, options.appendfiles, true);
    }

    if (options.noconsole) {
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
    inner_options = options || {};
    _innerLogger = new TraceLog(inner_options);
};

var inner_init = function (options) {
    'use strict';
    var inner_options = options || {};
    if (_innerLogger) {
        return;
    }
    _innerLogger = new TraceLog(inner_options);
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
    }
    _innerLogger = null;
};