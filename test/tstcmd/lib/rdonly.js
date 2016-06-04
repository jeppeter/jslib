var util = require('util');
var set_property_value = function (self, name, value) {
    'use strict';
    var hasproperties;
    var added = 0;
    hasproperties = Object.getOwnPropertyNames(self);
    if (hasproperties.indexOf(name) < 0) {
        Object.defineProperty(self, name, {
            enumerable: true,
            get: function () {
                return value;
            },
            set: function (v) {
                var errstr;
                v = v;
                errstr = util.format('can not set (%s) value', name);
                throw new Error(errstr);
            }
        });
        added = 1;
    }
    return added;
};

set_property_value(exports, 'COMMAND_SET', 10);
set_property_value(exports, 'SUB_COMMAND_JSON_SET', 20);
set_property_value(exports, 'COMMAND_JSON_SET', 30);
set_property_value(exports, 'ENVIRONMENT_SET', 40);
set_property_value(exports, 'ENV_SUB_COMMAND_JSON_SET', 50);
set_property_value(exports, 'ENV_COMMAND_JSON_SET', 60);
set_property_value(exports, 'DEFAULT_SET', 70);