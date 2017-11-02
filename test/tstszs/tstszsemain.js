var jstracer = require('jstracer');
var cheerio = require('cheerio');
var extargsparse = require('extargsparse');
var fs = require('fs');


var szse_main_get_number_span = function (htmldata) {
    'use strict';
    var parser;
    var content;
    var idx;
    var needidx = -1;
    var num = -1;
    parser = cheerio.load(htmldata);
    content = parser('tr').find('span');
    for (idx = 0; idx < content.length; idx += 1) {
        if (content.eq(idx).attr('class') === undefined) {
            if (needidx < 0) {
                needidx = idx;
            } else {
                num = parseInt(content.eq(idx).text(), 10);
                break;
            }
        }
    }
    return num;
};

var szse_get_ahrefs = function (htmldata) {
    'use strict';
    var parser;
    var content;
    var ahrefs = [];
    var currefs = {};
    var idx;
    var ahref;
    var url;

    parser = cheerio.load(htmldata);
    content = parser('tr').find('td');
    for (idx = 0; idx < content.length; idx += 1) {
        if (content.eq(idx).attr('class') === 'td2') {
            ahref = content.eq(idx).children('a');
            url = ahref.attr('href');
            //console.log('content[%d] [%s][%s]', idx,url,name);
            ahrefs.push(url);
        }
    }
    return ahrefs;
};

var call_numspan = function (err, numspan, args) {
    if (err !== undefined && err !== null) {
        console.error('parse error %s', err);
        return;
    }
    console.log('numspan %d', numspan);
    return;
};


var commandline = `
    {
        "$": "+"
    }
`;

var trace_exit = function (ec) {
    'use strict';
    jstracer.finish(function (err) {
        if (err) {
            return;
        }
        process.exit(ec);
    });
    return;
};



process.on('uncaughtException', function (err) {
    'use struct';
    jstracer.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', function () {
    'use strict';
    trace_exit(0);
});

var extparser = extargsparse.ExtArgsParse();
var args;
extparser.load_command_line_string(commandline);
jstracer.init_args(extparser);

args = extparser.parse_command_line();
jstracer.set_args(args);

args.args.forEach(function (fname, idx) {
    'use strict';
    fs.readFile(fname, function (err, data) {
        //var numspan;
        var ahrefs;
        if (err !== undefined && err !== null) {
            jstracer.error('[%s][%s] read error[%s]', idx, fname, err);
            return;
        }
        //numspan = szse_main_get_number_span(data);
        //console.log('numspan [%d]', numspan);
        ahrefs = szse_get_ahrefs(data);
        console.log('ahrefs [%s]', ahrefs);
    });
});