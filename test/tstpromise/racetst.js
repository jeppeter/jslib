var Promise = require('promise')

var p1 = new Promise(function(resolve, reject) { 
  setTimeout(resolve, 100, "one"); 
});

var p2 = new Promise(function(resolve,reject){
	setTimeout(resolve, 99,"two");
});


Promise.race([p1,p2]).then(function(value){
	console.log(value)
});

var p3 = new Promise(function(resolve,reject){
	setTimeout(resolve, 500,"three");
});

var p4 = new Promise(function(resolve,reject){
	setTimeout(resolve,100,"four");
});

Promise.race([p3,p4]).then(function(value){
	console.log(value);
},function(reason){
	console.log(reason);
});


var p5 = new Promise(function(resolve,reject){
	setTimeout(resolve,500,"five");
});

var p6 = new Promise(function(resolve,reject){
	setTimeout(reject,60,"six");
});

Promise.race([p5,p6]).then(function(value){
	console.log(value);
},function(reason){
	console.log(reason);
});