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

module.exports.NewPerson = function (name, addr) {
    'use strict';
    return new Person(name, addr);
};