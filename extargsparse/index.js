var keyparse = require('./keyparse');

function NewExtArgsParse(opt) {
    'use strict';
    var parser = {};
    var self;

    parser.flags = [];
    parser.subparsers = [];
    self = parser;
    self.load_command_line = function (cmdopt) {
        Object.keys(cmdopt).forEach(k) {

        }
    };

    self.load_command_line_string = function (cmdstr) {
        'use strict';
        var cmdopt;
        try {
            cmdopt = JSON.parse(cmdstr);
        } catch () {
            throw new Error('can not parse (%s)', cmdstr);
        }
        return self.load_command_line(cmdopt);
    };
    return parser;
}

module.exports.ExtArgsParse = NewExtArgsParse;