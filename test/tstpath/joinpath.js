var path = require('path');

var totalpath = ''

if (process.argv.length > 2){
	var listpath 
	listpath = process.argv.slice(2, -1)
	totalpath  = path.join(listpath)
}else{
	var program = ''
	program = process.argv[0]
	if (process.argv.length == 2){
		program - process.argv[1]
	}
	console.error('%s must more than 2 args', program)
	process.exit(3)
}