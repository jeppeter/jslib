var CryptoJS = require('crypto-js');
var dtime = (new Date().getTime() / 1000);
var stime = CryptoJS.enc.Utf8.parse(Math.floor(dtime));
var keystr = CryptoJS.enc.Utf8.parse('1234567887654321');
var encdata = CryptoJS.AES.encrypt(stime, keystr, {iv: keystr, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
var encbase64 = CryptoJS.enc.Base64.stringify(encdata.ciphertext);
//var skey = '';
stime.words.forEach(function (c) {
    'use strict';
    console.log('c %s', c);
});
console.log('stime %s encbase64 %s', stime, encbase64);