var commander = require('commander');
var util = require('util');
commander.commandname = '';
commander.suboptions = {};
commander.subargs = [];
commander
    .version('0.2.0')
    .option('-s --size <size>', 'size specify', 20)
    .option('-v --verbose', 'verbosity mode specify', function (v, total) {
        'use strict';
        v = v;
        return total + 1;
    }, 0);

commander
    .command('rmdir [otherdirs...]')
    .description('rmdirs ')
    .option('--rmmode <mode>', 'to rmmod mode', 'hello')
    .action(function (otherdirs, options) {
        'use strict';
        commander.commandname = 'rmdir';
        commander.suboptions = options;
        commander.subargs = otherdirs;
    });

commander
    .command('setup [otherdirs...]')
    .description('setups ')
    .option('--setupmode <mode>', 'to setup mode', 'hello')
    .action(function (otherdirs, options) {
        'use strict';
        commander.suboptions = options;
        commander.subargs = otherdirs;
        commander.commandname = 'setupmode';
    });

commander.parse(process.argv);
console.log('command %s', commander.commandname);
console.log('options (%s) ---------------\nargs(%s)', util.inspect(commander.suboptions, {
    showHidden: true,
    depeth: null
}), util.inspect(commander.subargs, {
    showHidden: true,
    depeth: null
}));