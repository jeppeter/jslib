var test = require('unit.js');
var person = require('./lib/Person');


describe('test create new person', function () {
    'use strict';
    var newf = new person.NewPerson('hello', 'wordl');
    test.assert(newf.GetName() === 'hello');
});

describe('test set person name', function () {
    'use strict';
    var newf = new person.NewPerson('hello', 'world');
    newf.SetName('jack');
    test.assert(newf.GetName() === 'jack');
});

describe('test set person address', function () {
    'use strict';
    var newf = new person.NewPerson('hello', 'world');
    newf.SetAddr('usa');
    test.assert(newf.GetAddr() === 'usa');
});