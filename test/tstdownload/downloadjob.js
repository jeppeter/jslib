var path = require('path');
var jstracer = require('jstracer');
var util = require('util');
var fs = require('fs');


function createDownloadJobs(args) {
    'use strict';
    var self = {};
    self.maxjobs = 3;
    self.input = '';
    self.output = '';
    self.downloadurls = [];
    self.downloadidx = 0;
    self.downloadjobs = 0;
    self.errorfiles = [];
    self.realdownload = null;
    self.overfunc = null;
    self.basedir = process.cwd();
    if (typeof args.maxjobs === 'number') {
        self.maxjobs = args.maxjobs;
    }

    if (typeof args.input === 'string') {
        self.input = args.input;
    }
    if (typeof args.output === 'string') {
        self.output = args.output;
    }

    if (typeof args.directory === 'string' && args.directory.length > 0) {
        self.basedir = args.directory;
    }

    self.write_error_files = function () {
        var outs = '';
        if (self.errorfiles.length > 0) {
            var idx = 0;
            while (idx < self.errorfiles.length) {
                outs += util.format('%s\n', self.errorfiles[idx]);
                idx += 1;
            }
        }
        if (self.output.length > 0) {
            fs.writeFile(self.output, outs, function (err) {
                if (err) {
                    jstracer.error('write [%s] error [%s]', self.output, err);
                }
                self.overfunc(err);
            });
        } else {
            fs.write(process.stdout.fd, outs, function (err) {
                if (err) {
                    jstracer.error('write stdout error [%s]', err);
                }
                self.overfunc(err);
            });
        }
    };

    self.download_one_file_end = function (err, cfile, url) {
        /*to delete one jobs*/
        self.downloadjobs -= 1;
        if (err) {
            jstracer.error('download [%s] [%s] error [%s]', url, cfile, err);
            self.errorfiles.push(url);
        }
        jstracer.info('download [%s] succ', url);

        if (self.downloadidx >= self.downloadurls.length && self.downloadjobs === 0) {
            /*we need to make jobs over*/
            self.write_error_files();
        } else {
            self.download_one_file();
        }
        return;
    };

    self.download_one_file = function () {
        if (self.downloadjobs >= self.maxjobs && self.maxjobs !== 0) {
            return 0;
        }

        if (self.downloadidx >= self.downloadurls.length) {
            return 0;
        }

        var cururl = self.downloadurls[self.downloadidx];
        var bname = path.basename(cururl);
        var cfile = path.join(self.basedir, bname);
        self.downloadidx += 1;
        self.downloadjobs += 1;
        self.realdownload(cururl, cfile, self.download_one_file_end);
        return 1;
    };

    self.start_download_data = function (err, data) {
        if (err) {
            jstracer.error('read error [%s]', err);
            self.overfunc(err);
            return;
        }
        var datas = data.toString();
        var sarr = datas.split('\n');
        var curl;
        var idx = 0;
        var elm;

        if (!fs.existsSync(self.basedir)) {
            fs.mkdirSync(self.basedir);
        }

        while (idx < sarr.length) {
            elm = sarr[idx];
            curl = elm.replace(/\r/, '');
            if (curl.length > 0) {
                self.downloadurls.push(curl);
            }
            idx += 1;
        }
        var retval;
        while (true) {
            retval = self.download_one_file();
            if (retval === 0) {
                break;
            }
        }
        return;
    };

    self.start_download = function (real_download, overfunc) {
        self.realdownload = real_download;
        self.overfunc = overfunc;
        self.downloadidx = 0;
        self.downloadjobs = 0;
        self.downloadurls = [];
        self.errorfiles = [];
        if (self.input.length > 0) {
            fs.readFile(args.input, self.start_download_data);
        } else {
            fs.read(process.stdin.fd, self.start_download_data);
        }
        return;
    };

    return self;
}

module.exports = createDownloadJobs;