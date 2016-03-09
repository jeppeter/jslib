process.on('SIGINT',function(){
	console.log('caught ctrl+c')
	process.exit(4)
})

setInterval(function(){
	console.log('will exit')
	process.exit(0)
}, 30000)