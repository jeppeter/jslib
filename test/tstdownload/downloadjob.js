

function createDownloadJobs(args) {
    'use strict';
    var self = {};
    self.maxjobs = 3;
    self.input = '';
    self.output = '';
    self.downloadfiles = [];
    self.downloadidx = 0;
    self.downloadjobs = 0;
    self.errorfiles = [];
    self.realdownload = null;
    if (typeof args.maxjobs === 'number') {
        self.maxjobs = args.maxjobs;
    }

    if (typeof args.input === 'string') {
        self.input = args.input;
    }
    if (typeof args.output === 'string') {
        self.output = args.output;
    }

    self.download_one_file = function () {
        if (self.downloadjobs >= self.maxjobs && self.maxjobs !== 0) {
            return;
        }

        if (self.downloadidx >= self.downloadfiles.length) {
            return;
        }

        var cfile
    };

    self.start_download = function (real_download) {
        self.realdownload = real_download;
        return;
    };

    return self;
}

module.exports = createDownloadJobs;