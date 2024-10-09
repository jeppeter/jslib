#! /bin/sh

curl -vvvvv  -d 'sdate=20241009&edate=20241009' -o out.json \
--header 'Accept: */*' --header 'Accept-EncKey: 7i7Jslm8QKMZGwn+Ri4yYA==' \
--header 'Accept-Encoding: gzip, deflate' --header 'Accept-Language: en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7' \
--header 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
--header 'Host: webapi.cninfo.com.cn' \
--header 'Origin: http://webapi.cninfo.com.cn' \
--header 'Referer: http://webapi.cninfo.com.cn/' \
--header 'User-Agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36' \
--header 'X-Requested-With: XMLHttpRequest' \
http://webapi.cninfo.com.cn/api/stock/p_public0001