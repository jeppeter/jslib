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

function list_handler() {

}

var parser;
var args;
parser = extargsparse.ExtArgsParse(opt);
parser.load_command_line_string(command_line);
args = parser.parse_command_line(process.argv[2: ], parser);