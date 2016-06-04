var pm = require('child_process');

var get_variable = function (name) {
    'use strict';
    if (process.env[name] !== undefined) {
        console.log('[%d]%s = %s', process.pid, name, process.env[name]);
    } else {
        console.log('[%d]%s undefined', process.pid, name);
    }
    return;
};

var renew_variable = function (name, value) {
    'use strict';
    if (process.env[name] !== undefined) {
        console.log('[%d]%s = %s', process.pid, name, process.env[name]);
        delete process.env[name];
    }

    if (process.env[name] !== undefined) {
        console.log('[%d]%s = %s still', process.pid, name, process.env[name]);
    }
    process.env[name] = value;
    return;
};

var delete_variable = function (name) {
    'use strict';
    if (process.env[name] !== undefined) {
        console.log('[%d]%s = %s', process.pid, name, process.env[name]);
        delete process.env[name];
    }
    return;
};

var new_process = function () {
    'use strict';
    const spawn = pm.spawn;
    const bat = spawn('node.exe', [__filename]);
    console.log('[%d] spawn (%s)', process.pid, __filename);
    bat.stdout.on('data', function (data) {
        console.log('[%d](%s)', process.pid, data);
    });
    bat.on('close', function (code) {
        console.log('[%d] get exit %d', process.pid, code);
    });
};

get_variable('EXTARGSPARSE_JSON');

process.argv.forEach(function (elm, idx) {
    'use strict';
    if (idx >= 2) {
        delete_variable('EXTARGSPARSE_JSON');
        new_process();
        renew_variable('EXTARGSPARSE_JSON', elm);
        new_process();
    }
});