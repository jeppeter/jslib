function Person(name, addr) {
    'use strict';
    this.name = name;
    this.addr = addr;
    this.GetAddr = function () {
        return this.addr;
    };
    this.GetName = function () {
        return this.name;
    };
    this.SetName = function (val) {
        this.name = val;
    };

    this.SetAddr = function (val) {
        this.addr = val;
    };
}

var person = new Person('james', 'usa');

console.log('name %s addr %s', person.GetName(), person.GetAddr());
person.SetName('bell');
person.SetAddr('uk');
console.log('name %s addr %s', person.GetName(), person.GetAddr());