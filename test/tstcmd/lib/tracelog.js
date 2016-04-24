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
            console.log('data (%s) %s', data, elm);
        });
        ws.on('close', function () {
            console.log('%s closed', elm);
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
    this.needcounts = 0;
    this.addcounts = 0;
    this.inner_end_callback = null;
    this.inner_callback = function (err) {
        if (err) {
            if (self.inner_end_callback !== null) {
                self.inner_end_callback(err);
            }
            return;
        }
        self.addcounts += 1;
        if (self.addcounts === self.needcounts) {
            if (self.inner_end_callback !== null) {
                self.inner_end_callback(null);
            }
        }
        return;
    };
    this.finish = function (callback) {
        var ws;
        self.needcounts = self.writeStreams.length;
        self.addcounts = 0;
        self.inner_end_callback = callback;
        //var idx;
        while (self.writeStreams.length > 0) {
            ws = self.writeStreams[0];
            self.writeStreams.splice(0, 1);
            ws.end('', self.inner_callback);
        }

        if (self.needcounts === self.addcounts) {
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


    this.innerLogger = tracer.console({
        format: [self.format],
        stackIndex: self.stackindex,
        transport: function (data) {
            process.stderr.write(data.output);
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