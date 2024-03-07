var jstracer = require('jstracer');
var util = require('util');
var extargsparse = require('extargsparse');
var fs = require('fs');


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

var command_line_format = `
{
    "input|i" : null,
    "output|o" : null,
    "download<download_handler>##to download files##" : {
        "$" : 0
    }
}
`;
var command_line;
var parser;
var args;

var download_file = function (url, file, callback) {
    'use strict';
    var wf = fs.createWriteStream(file);
    http.get(url, function (res) {
        if (res.statusCode !== 200) {
            var err = util.format('statusCode %d', res.statusCode);
            callback(err, file, url);
            return;
        }
        res.on('error', function (err) {
            wf.close();
            callback(err, file, url);
        });
        res.on('data', function (chunk) {
            wf.write(chunk);
        });
        res.on('end', function () {
            wf.close();
            callback(null, file, url);
        });
    });
};

var download_process_data = function (data) {
    'use strict';
    var sarr = data.split('\n');
    var nl ;
    var cfile;
    var bfile;
    var basedir = args.directory;
    if (args.directory.length === 0) {
        basedir = process.getcwd();
    }
    sarr.each(function(elm) {
        nl = elm.replace(/\r/,"");
        needfiles.push(nl);
    });
    needfiles.each(function(url) {
        bfile = path.basename(elem);
        cfile = path.join(basedir,bfile);
        download_file(url, cfile, download_callback);
    });
    return;
};

var download_handler = function (args) {
    'use strict';
    jstracer.set_args(args);
    if (args.input.length > 0) {
        fs.readFile(args.input, function(err, data) {
            if (err) {
                jstracer.error('can not read %s error [%s]', args.input, err);
                return;
            }
            download_process_data(data);
        });
    } else {
        fs.read(process.stdin.fd, function (data) {
            download_process_data(data);
        });
    }
};

exports.download_handler = download_handler;

parser = extargsparse.ExtArgsParse({
    help_func: function (ec, s) {
        'use strict';
        var fp;
        if (ec === 0) {
            fp = process.stdout;
        } else {
            fp = process.stderr;
        }
        fp.write(s);
        trace_exit(ec);
    }
});

command_line = util.format(command_line_format);
parser.load_command_line_string(command_line);
jstracer.init_args(parser);

process.on('uncaughtException', function (err) {
    'use struct';
    jstracer.error('error (%s) stack(%s)', err, err.stack);
    trace_exit(3);
});

process.on('SIGINT', function () {
    'use strict';
    trace_exit(3);
});

process.on('exit', function (coderr) {
    'use strict';
    trace_exit(coderr);
});

var needfiles = [];
var errorfiles = [];
var handleidx = 0;

var write_error_files = function (outfile) {
    var outs = '';
    errorfiles.each(function (elm) {
        outs += util.format('%s\n', elm);
    });
    if (outfile.length > 0) {
        fs.writeFile(outfile, outs, function (err) {
            if (err) {
                jstracer.error('write file [%s] error[%s]', outfile, err);
            }
            return;
        });
    } else {
        console.log(outs);
    }    
}


var download_callback = function(err, file, url) {
    handleidx += 1;
    if (err) {
        errorfiles.push(file);
        jstracer.error('download [%s] error [%s]', url, err);
        if (handleidx >= needfiles.length) {
            write_error_files(args.output);
        }
        return;
    }

    if (handleidx >= needfiles.length) {
        write_error_files(args.output);
    }
    return;
};


args = parser.parse_command_line();


