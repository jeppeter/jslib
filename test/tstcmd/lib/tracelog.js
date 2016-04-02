var tracer = require('tracer');
var util = require('util');
var fs = require('fs');

var _innerLogger;
var AddWriteStreams;

AddWriteStreams = function (self, arfiles, isappend) {
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
                    self.writeStreams.slice(i, 1);
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

function TraceLog(options) {
    'use strict';
    var self;
    self = this;
    this.level = 'error';
    this.writeStreams = [];
    this.waitStreams = [];
    this.stackindex = 1;
    this.finish = function () {
        var ws;
        //var idx;
        while (self.writeStreams.length - 1 >= 0) {
            ws = self.writeStreams[0];
            self.writeStreams.splice(0, 1);
            ws.end();
            console.log('%s end', ws.path);
            //ws.close();
        }
    };
    this.format = "<{{title}}>:{{file}}:{{line}} {{message}}\n";
    if (typeof options.format === 'string' && options.format.length > 0) {
        this.format = options.format;
    }

    if (typeof options.level === 'string') {
        this.level = options.level;
    }

    if (util.isArray(options.files) && options.files.length > 0) {
        AddWriteStreams(self, options.files, false);
    }

    if (util.isArray(options.appendfiles)) {
        AddWriteStreams(self, options.appendfiles, true);
    }


    this.innerLogger = tracer.console({
        format: [self.format],
        stackIndex: self.stackindex,
        transport: function (data) {
            process.stderr.write(data.output);
            if (true) {
                self.writeStreams.forEach(function (elm) {
                    elm.write(data.output);
                });
            }
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

function inner_init(options) {
    'use strict';
    var inner_options = options || {};
    if (_innerLogger) {
        return;
    }
    _innerLogger = new TraceLog(inner_options);
}

module.exports.log = function (data) {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.log(data);
};

module.exports.debug = function (data) {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.debug(data);
};


module.exports.trace = function (data) {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.trace(data);
};

module.exports.info = function (data) {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.info(data);
};

module.exports.warn = function (data) {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.warn(data);
};

module.exports.error = function (data) {
    'use strict';
    inner_init();
    _innerLogger.innerLogger.error(data);
};

module.exports.finish = function () {
    'use strict';
    if (_innerLogger !== null) {
        _innerLogger.finish();
    }
    _innerLogger = null;
};