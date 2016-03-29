var tracer = require('tracer');

var _innerLogger;

function TraceLog(options) {
    'use strict';
    this.level = 'error';
    this.writeStreams = [];
    this.waitStreams = [];
    this.writefunctions = function (data) {
        process.stderr.write(data);
    };
    this.format = "<{{title}}>:{{file}}:{{line}}\t{{message}}";

    this.innerLogger = tracer.console(
        transport: function (data) {
            this.writefunctions(data);
        }; format: [this.format]
    );

    this.innerLogger.setLevel(this.level);
    this.inner

}

module.exports.Init = function (options) {
    inner_options = options || {};

}