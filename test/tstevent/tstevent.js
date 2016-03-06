var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
var Promise = require('promise');

event.on('status',function(){
	console.log('call status')
});

event.on('error',function(){
	console.error('call error');
});

setTimeout(function(){
	event.emit('status')
}, 100);

var cnt =0;
var errintl;

errintl = setInterval(function(){
	cnt ++;
	if (cnt < 10){
	event.emit('error');
}	else{
	clearInterval(errintl);
}
}, 300);