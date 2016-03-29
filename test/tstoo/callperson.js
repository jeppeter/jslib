var Person = require('./lib/Person');

var person = Person.NewPerson('james', 'hz');
console.log('name %s addr %s', person.GetName(), person.GetAddr());
person.SetName('bill');
person.SetAddr('usa');
console.log('name %s addr %s', person.GetName(), person.GetAddr());