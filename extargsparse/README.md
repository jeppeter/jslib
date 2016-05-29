# extargsparse 
> _a extensible json directive command line libraries_

### a simple example

```js
var extargsparse  = require('extargsparse');
var parser,args;
var commandline=`
{
    "verbose|v##increment verbose mode##" : "+",
    "flag|f## flag set##" : false,
    "number|n" : 0,
    "list|l" : [],
    "string|s" : "string_var",
    "$" : "*"
}
`
parser = extargsparse.ExtArgsParse();
parser.load\_command\_line_string(commandline);
args = parser.parse\_command_line();
console.log('args.verbose %d',args.verbose);
console.log('args.flag %s',args.flag);
console.log('args.number %d',args.number);
console.log('args.list %s',args.list);
console.log('args.string %s',args.string);
console.log('args.args %s',args.args);
```
> if you run the command in node simple.js  -vvvv -f -n 30 -l bar1 -l bar2 var1 var2

result
```shell
args.verbose 4
args.flag true
args.number 30
args.list ['bar1','bar2']
args.string string_var
args.args ['var1','var2']
```

### some complex example

```js
var extargsparse  = require('extargsparse');
var parser,args;
var commandline=`
{
    "verbose|v" : "+",
    "port|p" : 3000,
    "dep" : {
        "list|l" : [],
        "string|s" : "s_var",
        "$" : "+"
    }
}
`
parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(commandline);
args = parser.parse_command_line(['-vvvv','-p','5000','dep','-l','arg1','--dep-list','arg2','cc','dd']);
console.log('args.verbose %d',args.verbose);
console.log('args.port %d',args.port);
console.log('args.subcommand %s',args.subcommand);
console.log('args.dep_list %s',args.dep_list);
console.log('args.dep_string %s',args.dep_string);
console.log('args.subnargs %s',args.subnargs);
```

> result is 
```shell
args.verbose  4
args.port 5000
args.subcommand dep
args.dep_list ['arg1','arg2']
args.subnargs ['cc','dd']
```
# multiple subcommand example

```js
var extargsparse  = require('extargsparse');
var parser,args;
var commandline=`
{
    "verbose|v" : "+",
    "port|p" : 3000,
    "dep" : {
        "list|l" : [],
        "string|s" : "s_var",
        "$" : "+"
    },
    "rdep" : {
       "list|L" : [],
       "string|S" : "s_rdep",
       "$" : 2
     }
}
`
parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(commandline);
args = parser.parse_command_line(['-vvvv','-p','5000','rdep','-L','arg1','--rdep-list','arg2','cc','dd']);
console.log('args.verbose %d',args.verbose);
console.log('args.port %d',args.port);
console.log('args.subcommand %s',args.subcommand);
console.log('args.rdep_list %s',args.rdep_list);
console.log('args.rdep_string %s',args.rdep_string);
console.log('args.subnargs %s',args.subnargs);
```

> result is 

```shell
args.verbose 4
args.port 5000
args.subcommand rdep
args.rdep_list ['arg1','arg2']
args.rdep_string s_rdep
args.subnargs ['cc','dd']
```

# use multiple load command string

```js
var extargsparse  = require('extargsparse');
var parser,args;
var command1=`
    {
      "verbose|v" : "+",
      "port|p" : 3000,
      "dep" : {
        "list|l" : [],
        "string|s" : "s_var",
        "$" : "+"
      }
    }
`
var command2=`
    {
      "rdep" : {
        "list|L" : [],
        "string|S" : "s_rdep",
        "$" : 2
      }
    }
`

parser = extargsparse.ExtArgsParse();
parser.load_command_line_string(command1);
parser.load_command_line_string(command2);
args = parser.parse_command_line(['-p','7003','-vvvvv','rdep','-L','foo1','-S','new_var','zz','64']);
console.log('args.verbose %d',args.verbose);
console.log('args.port %d',args.port);
console.log('args.subcommand %s',args.subcommand);
console.log('args.rdep_list %s',args.rdep_list);
console.log('args.rdep_string %s',args.rdep_string);
console.log('args.subnargs %s',args.subnargs);
```
> result is

```shell
args.verbose 5
args.port 7003
args.subcommand rdep
args.rdep_list ['foo1']
args.rdep_string new_var
args.subnargs ['zz','64']
```