const express = require("express");
const app = express();

function trace_exit(ec) {
    process.exit(ec);
}

process.on('SIGINT',function() {
    console.log('SIGINT');
    trace_exit(0);
});

process.on('SIGTERM',function() {
    console.log('SIGTERM');
    trace_exit(0);
});

app.get("/", function(req, res) {
    return res.send("Hello World");
});

app.listen(3000, function(){
    console.log('Listening on port 3000');
});