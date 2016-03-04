var fs = require('fs');

process.argv.forEach(function(val,index,array){
	fs.readFile(val, 'utf-8', function(err,data){
		if (err){
			console.log('[%s] read error %s', val,err);
			return;
		}
		if (index >= 2){
		console.log('[%s]-----------\n%s\n[%s]+++++++++++++++\n', val,data,val);
	}
	})
});