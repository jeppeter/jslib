#! /bin/bash

scrfile=`readlink -f $0`
srcdir=`dirname $scrfile`

lastdir=$PWD
cd $srcdir
openssl genrsa -des3 -out base.key --passout pass:xxfs 2048
openssl rsa -in base.key --passin pass:xxfs -out selfsigned.key
openssl req -new -key selfsigned.key -subj "/C=CN/ST=Zhejiang/L=Hangzhou/O=Global Security/OU=IT Department/CN=localhost" -out selfsigned.csr
openssl x509 -req -days 365 -in selfsigned.csr -signkey selfsigned.key -out selfsigned.crt
cd $lastdir