var fs = require('fs');

var ws = fs.createWriteStream("debug.txt", {
    flags: 'w+'
});

var i = 0;

for (i = 0; i < 100; i += 1) {
    console.log("writing");
    ws.write("random text\n");
}

//ws.end();