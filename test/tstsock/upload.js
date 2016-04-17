var http = require("http");
var url = require("url");
var multipart = require("./multipart-js");
var util = require("util");
var fs = require("fs");

function upload_complete(res) {
    'use strict';
    util.debug("Request complete");

    // Render response
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });
    res.write("Thanks for playing!");
    res.end();

    util.puts("\n=> Done");
}

/*
 * Create multipart parser to parse given request
 */
function parse_multipart(req) {
    'use strict';
    var parser = multipart.parser();

    // Make parser use parsed request headers
    parser.headers = req.headers;

    // Add listeners to request, transfering data to parser

    req.addListener("data", function (chunk) {
        parser.write(chunk);
    });

    req.addListener("end", function () {
        parser.close();
    });

    return parser;
}

function basename(path) {
    'use strict';
    return path.replace(/\\/g, '/').replace(/.*\//, '');
}


/*
 * Handle file upload
 */
function upload_file(req, res) {
    'use strict';
    // Request body is binary
    //req.setBodyEncoding("binary");

    // Handle request as multipart
    var stream = parse_multipart(req);

    var fileName = null;
    var fileStream = null;

    // Set handler for a request part received
    stream.onPartBegin = function (part) {

        util.debug("Started part, name = " + part.name + ", filename = " + part.filename);
        fileName = basename(part.filename);


        // Construct file name
        fileName = "./uploads/" + stream.part.filename;
        fileName = fileName.replace(/:/g, '');

        // Construct stream used to write to file
        fileStream = fs.createWriteStream(fileName);

        // Add error handler
        fileStream.addListener("error", function (err) {
            util.debug("Got error while writing to file '" + fileName + "': ", err);
        });

        // Add drain (all queued data written) handler to resume receiving request data
        fileStream.addListener("drain", function () {
            req.resume();
        });
    };

    // Set handler for a request part body chunk received
    stream.onData = function (chunk) {
        // Pause receiving request data (until current chunk is written)
        req.pause();

        // Write chunk to file
        // Note that it is important to write in binary mode
        // Otherwise UTF-8 characters are interpreted
        util.debug("Writing chunk");
        fileStream.write(chunk, "binary");
    };

    // Set handler for request completed
    stream.onEnd = function () {
        // As this is after request completed, all writes should have been queued by now
        // So following callback will be executed after all the data is written out
        fileStream.addListener("drain", function () {
            // Close file stream
            fileStream.end();
            // Handle request completion, as all chunks were already written
            upload_complete(res);
        });
    };
}


/*
 * Display upload form
 */
function display_form(req, res) {
    'use strict';
    req = req;
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    res.write(
        '<form action="/upload" method="post" enctype="multipart/form-data">' +
        '<input type="file" multipart name="upload-file">' +
        '<input type="submit" value="Upload">' +
        '</form>'
    );
    res.end();
}

/*
 * Handles page not found error
 */
function show_404(req, res) {
    'use strict';
    req = req;
    res.writeHead(404, {
        "Content-Type": "text/plain"
    });
    res.write("You r doing it rong!");
    res.end();
}

var server = http.createServer(function (req, res) {
    'use strict';
    // Simple path-based request dispatcher
    switch (url.parse(req.url).pathname) {
    case '/':
        display_form(req, res);
        break;
    case '/upload':
        upload_file(req, res);
        break;
    default:
        show_404(req, res);
        break;
    }
});

// Server would listen on port 8000
server.listen(8000);