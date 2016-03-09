var path = require('path');

for (var i = 2 ; i < process.argv.length;i++){
	var p = process.argv[i]
	if (path.isAbsolute(p)){
		console.info('%s is absolute',p)
	}else{
		console.info('%s not absolute',p)
	}
}
