var grabwork = require('../../grabwork');
var extargsparse = require('extargsparse');
var tracelog = require('tracelog');

var command_line = ` {
	"verbose|v": "+",
	"list<list_handler>" : {
		"$" : "+"
	}
}
`;

exports.list_handler = function list_handler() {
	'use strict';
};



var parser;
parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(command_line);
parser.parse_command_line(null, parser);