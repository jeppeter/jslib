var async = require('async');

var handler = function()
{
  async.series([
  function(callback) {
    setTimeout(function() {
      console.log('Task 1');
      callback(null, 1);
    }, 300);
  },
  function(callback) {
    setTimeout(function() {
      console.log('Task 2');
      callback(null, 2);
    }, 200);
  },
  function(callback) {
    setTimeout(function() {
      console.log('Task 3');
      callback(null, 3);
    }, 100);
  }
  ], function(error, results) {
    return results;
  });
}

var result = handler();
console.log(result);