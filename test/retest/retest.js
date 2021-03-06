var extargsparse = require('extargsparse');
var parser;
var args;
var jstracer = require('jstracer');
var commandline = `
    {
        "restr|r"  : null,
        "global|g" : false,
        "match<match_handler>" : {
            "$" : "+"
        },
        "findall<findall_handler>" :  {
            "$" : "+"
        },
        "replace<replace_handler>" : {
            "$" : "+"
        }
    }
`;

var match_handler = function (args) {
    'use strict';
    var i;
    var restr = args.restr;
    var curstr;
    parser = parser;
    jstracer.set_args(args);
    if (args.restr === undefined || args.restr === null) {
        jstracer.error('no restr specified');
        process.exit(3);
        return;
    }

    for (i = 0; i < args.subnargs.length; i += 1) {
        curstr = args.subnargs[i];
        if (curstr.match(restr)) {
            console.log('<%s> match <%s>', curstr, restr);
        } else {
            console.log('<%s> not match <%s>', curstr, restr);
        }
    }
    return;
};

var findall_handler = function (args) {
    'use strict';
    var restr = args.restr;
    var re;
    var curstr;
    var i;
    var j;
    var matches;
    parser = parser;
    jstracer.set_args(args);
    if (restr === undefined || restr === null) {
        jstracer.error('not specified restr');
        process.exit(3);
        return;
    }

    re = new RegExp(restr);

    for (i = 0; i < args.subnargs.length; i += 1) {
        curstr = args.subnargs[i];
        matches = re.exec(curstr);
        if (matches !== null) {
            console.log('<%s> find <%s>', curstr, restr);
            for (j = 0; j < matches.length; j += 1) {
                console.log('    [%d] : %s', j, matches[j]);
            }

        } else {
            console.log('<%s> not find any <%s>', curstr, restr);
        }
    }
    return;
};

var replace_handler = function (args){
    var instr="";
    var restr="";
    var repstr="";
    var nstr ;
    var expr;
    if (args.subnargs.length < 2) {
        jstracer.error('no restr specified');
        process.exit(3);
        return;        
    }

    instr =args.subnargs[0];
    restr = args.subnargs[1];
    if (args.subnargs.length >= 3) {
        repstr = args.subnargs[2];
    }

    nstr = instr.replace(restr,repstr);
    console.log("nstr [%s] is [%s] ([%s] => [%s])", nstr, instr, restr, repstr);
    return ;
};

exports.match_handler = match_handler;
exports.findall_handler = findall_handler;
exports.replace_handler = replace_handler;

parser = extargsparse.ExtArgsParse();
jstracer.init_args(parser);
parser.load_command_line_string(commandline);
args = parser.parse_command_line(null, parser);
args = args;

