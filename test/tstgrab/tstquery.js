var grabcheerio = require('./grabcheerio');
var fs = require('fs');
var commander = require('commander');
var tracelog = require('../../tracelog');
var util = require('util');

commander.subname = '';

commander
    .version('0.2.0')
    .usage('[options] ');



var trace_exit = function (ec) {
    'use strict';
    tracelog.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};



var usage = function (ec, cmd, fmt) {
    'use strict';
    var fp = process.stderr;
    if (ec === 0) {
        fp = process.stdout;
    }

    if (fmt !== undefined && typeof fmt === 'string' && fmt.length > 0) {
        fp.write(util.format('%s\n', fmt));
    }

    cmd.outputHelp(function (txt) {
        fp.write(txt);
        return '';
    });
    trace_exit(ec);
    return;
};

commander
    .command('query <html>')
    .action(function (html, options) {
        'use strict';
        commander.subname = 'query';
        tracelog.set_commander(options.parent);
        fs.readFile(html, function (err, data) {
            var list_result;
            if (err) {
                tracelog.error('read %s (%s)', html, JSON.stringify(err));
                trace_exit(3);
                return;
            }
            list_result = grabcheerio.find_query_result(data);
            tracelog.info('list_result (%s)', util.inspect(list_result));
            trace_exit(0);
            return;
        });
    });

commander
    .command('morequery <html>')
    .action(function (html, options) {
        'use strict';
        commander.subname = 'morequery';
        tracelog.set_commander(options.parent);
        fs.readFile(html, function (err, data) {
            var list_result;
            if (err) {
                tracelog.error('read %s (%s)', html, JSON.stringify(err));
                trace_exit(3);
                return;
            }
            list_result = grabcheerio.more_query_html(data);
            tracelog.info('list_result (%s)', util.inspect(list_result));
            trace_exit(0);
            return;
        });
    });


commander
    .command('combind <url> <pdf>')
    .description('to combind url and pdf')
    .action(function (url, pdf, options) {
        'use strict';
        var retval;
        commander.subname = 'combind';
        tracelog.set_commander(options.parent);

        retval = grabcheerio.combine_dir(url, pdf);
        console.log('<%s> <%s> = <%s>', url, pdf, retval);
    });

tracelog.init_commander(commander);
commander.parse(process.argv);


if (commander.subname.length === 0) {
    usage(3, commander, 'please call a subcommand');
}