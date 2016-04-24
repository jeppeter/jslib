var filehandle = require('./lib/filehandle');
var qs = require('querystring');
var util = require('util');
var http = require('http');
var tracelog = require('./lib/tracelog');
var yargs = require('yargs');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var args = yargs.count('verbose')
    .alias('verbose', 'v')
    .usage(util.format('Usage %s [OPTIONS] directory', process.argv[1]))
    .help('h')
    .alias('h', 'help')
    .default('appendlog', [])
    .alias('appendlog', 'A')
    .default('createlog', [])
    .alias('createlog', 'C')
    .default('path', __dirname)
    .alias('path', 'P')
    .default('port', 9000)
    .alias('port', 'p')
    .default('format', '<{{title}}>:{{file}}:{{line}} {{message}}\n')
    .alias('format', 'F').argv;


var directory = args.path;
var lport = args.port;
var logopt = {};
var jsdir = __dirname;
var indexejs = jsdir + path.sep + 'index.ejs';
var ejsdata = fs.readFileSync(indexejs, {
    encoding: 'utf-8'
});


if (args.verbose >= 4) {
    logopt.level = 'trace';
} else if (args.verbose >= 3) {
    logopt.level = 'debug';
} else if (args.verbose >= 2) {
    logopt.level = 'info';
} else if (args.verbose >= 1) {
    logopt.level = 'warn';
} else {
    logopt.level = 'error';
}

if (args.C.length > 0) {
    logopt.files = args.C;
}

if (args.A.length > 0) {
    logopt.appendfiles = args.A;
}

logopt.format = args.format;
tracelog.Init(logopt);
filehandle.set_dir(directory);

http.createServer(function (req, res) {
    'use strict';
    var inputjson;
    var host, hostarr;
    inputjson = {};
    /*tracelog.info(util.inspect(req, {
        showHidden: true,
        depth: null
    }));*/
    inputjson.requrl = qs.unescape(req.url);
    host = req.headers.host;
    hostarr = host.split(':');
    host = hostarr[0];
    host = util.format('http://%s:%d', host, lport + 1);
    tracelog.info('(%s)method %s', req.headers.host, req.method);
    if (req.method === 'GET') {
        filehandle.list_dir(inputjson, req, res, function (err, outputjson, req, res) {
            var s;
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify(err));
                return;
            }

            if (outputjson.hashandled) {
                /*to no handle this*/
                return;
            }

            outputjson.url = req.url;
            outputjson.host = host;
            try {
                tracelog.info('%s', JSON.stringify(outputjson));
                s = ejs.render(ejsdata, outputjson);
                tracelog.info('html (%s)', s);
                res.writeHead(200);
                res.end(s);
                return;
            } catch (e) {
                res.writeHead(500);
                if (typeof e === 'object') {
                    tracelog.error('error (%s) (stack %s)', err.message, err.stack);
                } else {
                    tracelog.error('error %s', err);
                }
                res.end(JSON.stringify(e));
                return;
            }

            /*res.writeHead(200);
            s = req.url;
            s = '';
            s += '<!DOCTYPE html>\n';
            s += '<html>\n<head>\n';
            s += '  <meta charset="utf-8">\n';
            s += '  <meta http-equiv="X-UA-Compatible" content="IE=edge">\n';
            s += '\n';
            s += '  <title>File Uploader listed</title>\n';
            s += util.format('  <link rel="stylesheet" href="%s/public/css/bootstrap.min.css">\n', host);
            s += util.format('  <link href="%s/public/css/styles.css" rel="stylesheet">\n', host);
            s += '</head>\n';
            s += '<body>\n';
            s += '    <div class="outer">\n';
            s += '      <div class="middle">\n';
            s += '        <div class="inner">\n';

            if (util.isArray(outputjson.lists)) {
                outputjson.lists.forEach(function (elm) {
                    var tabcnt;
                    for (tabcnt = 0; tabcnt < 12; tabcnt += 1) {
                        s += ' ';
                    }
                    if (elm.type === 'dir') {
                        s += util.format('<a href="%s">%s</a> %s <br>\n', elm.href, elm.displayname, 'DIR');
                    } else {
                        s += util.format('<a href="%s">%s</a> size %d %s <br>\n', elm.href, elm.displayname, elm.size, 'FILE');
                    }
                });
            }

            s += '            <div class="progress">\n';
            s += '              <div class="progress-bar" role="progressbar"></div>\n';
            s += '            </div>\n';
            s += '            <button class="btn btn-lg upload-btn" type="button">Upload File</button>\n';
            s += '        </div>\n';
            s += '      </div>\n';
            s += '    </div>\n';
            s += '  <input id="upload-input" type="file" name="uploads[]" multiple="multiple"></br>\n';
            s += util.format('  <script src="%s/public/javascripts/jquery-2.2.0.min.js"></script>\n', host);
            s += util.format('  <script src="%s/public/javascripts/bootstrap.min.js"></script>', host);
            s += '  <script>\n';
            s += '  $(\'.upload-btn\').on(\'click\', function (){\n';
            s += '      $(\'#upload-input\').click();\n';
            s += '      $(\'.progress-bar\').text(\'0%\');\n';
            s += '      $(\'.progress-bar\').width(\'0%\');\n';
            s += '  });\n';
            s += '\n';

            s += '  $(\'#upload-input\').on(\'change\', function(){\n';
            s += '    var files = $(this).get(0).files;\n';
            s += '    if (files.length > 0){\n';
            s += '      var formData = new FormData();\n';
            s += '      for (var i = 0; i < files.length; i++) {\n';
            s += '        var file = files[i];\n';
            s += '        formData.append(\'uploads[]\', file, file.name);\n';
            s += '    }\n';
            s += '      $.ajax({\n';
            s += util.format('        url: \'%s\',', req.url);
            s += '        type: \'POST\',\n';
            s += '        data: formData,\n';
            s += '        processData: false,\n';
            s += '        contentType: false,\n';
            s += '        success: function(data){\n';
            s += '            console.log(\'upload successful!\\n\' + data);\n';
            s += '        },\n';
            s += '        xhr: function() {\n';
            s += '          var xhr = new XMLHttpRequest();\n';
            s += '          xhr.upload.addEventListener(\'progress\', function(evt) {\n';
            s += '            if (evt.lengthComputable) {\n';
            s += '              var percentComplete = evt.loaded / evt.total;\n';
            s += '              percentComplete = parseInt(percentComplete * 100);\n';
            s += '              $(\'.progress-bar\').text(percentComplete + \'%\');\n';
            s += '              $(\'.progress-bar\').width(percentComplete + \'%\');\n';
            s += '              if (percentComplete === 100) {\n';
            s += '                $(\'.progress-bar\').html(\'Done\');\n';
            s += '              }\n';
            s += '            }\n';
            s += '          }, false);\n';
            s += '          return xhr;\n';
            s += '        }\n';
            s += '      });\n';
            s += '    }\n';
            s += '  });\n';
            s += '  </script>\n';
            s += '</body>\n';
            s += '</html>\n';
            ejs = ejs;
            indexejs = indexejs;
            tracelog.info('html (%s)', s);
            res.end(s);*/
        });
    } else if (req.method === 'PUT' || req.method === 'POST') {
        filehandle.put_file(inputjson, req, res, function (err, outputjson, req, res) {
            if (err) {
                res.writeHead(500);
                res.write(JSON.stringify(err));
                res.end();
                return;
            }
            outputjson = outputjson;
            req = req;

            res.writeHead(200);
            res.write('success');
            res.end();
            return;

        });
    } else if (req.method === 'OPTIONS') {
        var body = [];
        req.on('data', function (chunk) {
            body.push(chunk);
        }).on('end', function () {
            var setmaxage = false;
            tracelog.info('body (%s)', Buffer.concat(body).toString());
            if (req.headers['access-control-request-method']) {
                res.headers('access-control-request-method', req.headers['access-control-request-method']);
                setmaxage = true;
            }

            if (req.headers['access-control-request-headers']) {
                res.headers('access-control-request-headers', req.headers['access-control-request-headers']);
                setmaxage = true;
            }

            if (setmaxage) {
                res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
            }
            res.sendStatus(200);
        });
    }
}).listen(lport);

http.createServer(function (req, res) {
    'use strict';
    var requrl;
    var getfile;
    var newfile;
    var rstream;
    var host;
    var hostarr;
    tracelog.info('(%s)method %s', req.headers.host, req.method);
    if (req.method === 'GET') {
        requrl = req.url;
        host = req.headers.host;
        hostarr = host.split(':');
        hostarr = hostarr[0].split(':');
        getfile = qs.unescape(requrl);
        getfile = jsdir + getfile;


        newfile = getfile.replace(path.sep, '/');
        while (newfile !== getfile) {
            getfile = newfile;
            newfile = getfile.replace(path.sep, '/');
        }
        getfile = getfile.replace(/[\/]+/g, path.sep);
        tracelog.info('get file %s', getfile);

        fs.stat(getfile, function (err, stats) {
            var errorinfo;
            if (err) {
                errorinfo = util.format('error %s', JSON.stringify(err));
                res.write(errorinfo);
                res.end();
                return;
            }

            if (stats.isDirectory()) {
                errorinfo = util.format('(%s) is directory');
                res.write(errorinfo);
                res.end();
                return;
            }

            rstream = fs.createReadStream(getfile);
            rstream.on('open', function () {
                tracelog.info('opened (%s)', getfile);
                rstream.pipe(res);
            });
            rstream.on('error', function (err) {
                tracelog.error('read %s error(%s)', getfile, JSON.stringify(err));
                res.end();
            });

            rstream.on('end', function () {
                tracelog.info('ended (%s)', getfile);
                res.end();
            });

        });
    } else if (req.method === 'POST' || req.method === 'PUT') {
        res.writeHead(501);
        res.end();
    }
}).listen(lport + 1);

tracelog.info('listne(%d) on (%s)', lport, directory);