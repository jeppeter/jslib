process.nextTick(function(){
	console.info('call from nextTick');
});

setImmediate(function(){
	console.info('call from immediate');
});

console.info('call start')