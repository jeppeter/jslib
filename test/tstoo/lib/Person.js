function Person(name, addr) {
    'use strict';
    this.name = name;
    this.addr = addr;
}

Person.prototype.GetAddr = function () {
    'use strict';
    return this.addr;
};

Person.prototype.SetAddr = function (addr) {
    'use strict';
    this.addr = addr;
    return;
};

Person.prototype.GetName = function () {
    'use strict';
    return this.name;
};


Person.prototype.SetName = function (name) {
    'use strict';
    this.name = name;
    return;
};

module.exports.NewPerson = function (name, addr) {
    'use strict';
    return new Person(name, addr);
};