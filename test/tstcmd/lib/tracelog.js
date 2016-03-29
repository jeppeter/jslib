var tracer = require('tracer');
var util = require('util');
var fs = require('fs');

var _innerLogger;

function TraceLog(options) {
    'use strict';
    var curlog;
    this.level = 'error';
    this.writeStreams = [];
    this.waitStreams = [];
    this.stackindex = 1;
    this.writefunctions = function (data) {
        process.stderr.write(data);
        if (_innerLogger !== null) {
            _innerLogger.writeStreams.forEach(function (elm) {
                elm.write(data);
            });
        }
    };
    this.finish = function () {
        if (_innerLogger !== null) {
            var ws;
            while (_innerLogger.writeStreams.length > 0) {
                ws = _innerLogger.writeStreams[0];
                _innerLogger.writeStreams.slice(0, 1);
                ws.end();
                ws.close();
            }
        }
    };
    this.format = "<{{title}}>:{{file}}:{{line}} {{message}}";
    if (typeof options.format === 'string' && options.format.length > 0) {
        this.format = options.format;
    }

    if (typeof options.level === 'string') {
        this.level = options.level;
    }

    curlog = this;
    if (util.isArray(options.files) && options.files.length > 0) {
        options.files.forEach(function (elm) {
            var ws;
            console.log('create stream %s', elm);
            ws = fs.createWriteStream(elm);
            ws.on('error', function (err) {
                var i;
                console.error('error on %s (%s)', elm, err);
                for (i = 0; i < curlog.writeStreams.length; i += 1) {
                    if (curlog.writeStreams[i] === ws) {
                        curlog.writeStreams.slice(i, 1);
                        break;
                    }
                }
            });
            ws.on('data', function (data) {
                console.log('data (%s) %s', data, elm);
            });
            curlog.writeStreams.push(ws);
        });
    }


    this.innerLogger = tracer.console({
        format: [this.format],
        stackIndex: this.stackindex
    });

    this.innerLogger.transport = this.writefunctions;

    tracer.setLevel(this.level);

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