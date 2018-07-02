/**
 * Created by Administrator on 2017/12/24.
 */
var querystring = require('querystring');
var chalk = require('chalk');
var fs = require('fs');
var path = require('path');
var http = require("http");
var BufferHelper = require('bufferhelper');
var iconv = require('iconv-lite');
var cheerio = require("cheerio");
// var request = require('request');
var urlencode = require('urlencode');
var pkg = require(process.cwd() + '/package.json');
var config = require(process.cwd() + '/server-conf.json');


var option = {
    hostname: config.host ? config.host : "10.100.2.150",
    port: config.port ? config.port : "8083",
    path: "/marketmng/theme/list"
};


var
    listUrl = "http://10.100.2.150:8083/marketmng/theme/list",
    newUrl = "http://10.100.2.150:8083/marketmng/theme/save?action=add",
    updateUrl = "http://10.100.2.150:8083/marketmng/theme/save?action=update&code=111",
    themeCode = 0;


var formData = {
    "code": config.code,
    "name": config.title,
    "status": "ENABLED",
    "index": "",
    "logo": "",
    "extJson": "",
    "shareId": config.shareId
};


//递归列出文件夹内容
var getAllFolersAndFiles = (function () {
    function iterator(url, folders, files) {
        var stat = fs.statSync(url);
        if (stat.isDirectory()) {
            folders.unshift(url);//收集目录
            inner(url, folders, files);
        } else if (stat.isFile()) {
            files.unshift(url);//收集文件
        }
    }

    function inner(path, folders, files) {
        var arr = fs.readdirSync(path);
        for (var i = 0, el; el = arr[i++];) {
            iterator(path + "/" + el, folders, files);
        }
    }

    return function (dir) {
        var folders = [], files = [];
        try {
            iterator(dir, folders, files);
        } catch (e) {
            console.log("catch");
        } finally {
            return {
                folders: folders,
                files: files
            }
        }
    }
})();

//判断当前config里面的code是否为空
//如果为空就调用save方法
//如果不为空就调用update方法

//遍历当前的
var theme = {
    init: function (data) {
        config.code == "0" ? theme.add(data) : theme.update(config.code, data);
    },
    getPage: function (opt, callback) {

        var req = http.request(opt, function (res) {
            var arrBuf = [];
            var bufLength = 0;
            res.on("data", function (chunk) {
                arrBuf.push(chunk);
                bufLength += chunk.length;
            });

            res.on("end", function (chunk) {
                // arrBuf是个存byte数据块的数组，byte数据块可以转为字符串，数组可不行
                // bufferhelper也就是替你计算了bufLength而已
                var chunkAll = Buffer.concat(arrBuf, bufLength);
                var strJson = iconv.decode(chunkAll, 'gb2312'); // 汉字不乱码

                var query = cheerio.load(strJson, {decodeEntities: false});

                if (callback) callback(query);
            });
        });

        req.on("error", function (e) {
            console.log("报错了:" + e.message);
        });
        req.end();
    },
    postForm: function (data, path, callback) {
        option.path = path;
        var post_data_str = urlencode.stringify(data, {charset: 'gbk'});
        var post_options = {
            host: option.hostname,
            port: option.port,
            path: option.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': post_data_str.length
            }
        };
        var req = http.request(post_options, function (res) {
            res.on('data', function (chunk) {

            });
            res.on('end', function (chunk) {
                if (callback) callback();
            });
        });

        req.write(post_data_str);
        req.end();
    },
    list: function () {
        option.path = "/marketmng/theme/list";


        this.getPage(option, function () {
            var $ = arguments[0];
            var $table = $("table.stripe");
            if ($table.length == 0) return false;
            var $tr = $table.find("tr");
            $tr.each(function () {
                var $this = $(this);
                $this.find("td").each(function () {
                    var $that = $(this);
                    var $tdTxt = $that.text();
                    var $par = $that.parent();
                    if ($tdTxt == formData.name) {
                        var themeCode = $par.find("td").eq(0).text();
                        console.log(themeCode)

                        //写入themeCode到devconfig.json里面
                        fs.readFile(process.cwd() + '/server-conf.json', "utf-8", function (err, data) {
                            if (err) {
                                return console.log(err);
                            }



                            var configJson = JSON.parse(data);
                            configJson.code = themeCode;

                            var v = configJson.version.replace(/\./g,"")*1;
                            var vStr = (v+1).toString();
                            var nVersion = [];
                            for(var i=0;i<vStr.length;i++){
                                nVersion.push(vStr[i])
                            }
                            configJson.version = nVersion.join(".");

                            console.log(configJson)

                            var writeData = JSON.stringify(configJson);

                            fs.writeFile(process.cwd() + '/server-conf.json', writeData, function (err, data) {
                                if (err) {
                                    return console.log(err)
                                }
                                console.log("   # 本地配置主题code和version已更新");
                                console.log();
                            })
                        })

                    }
                })
            });
        });
    },
    detail: function (callback) {
        option.path = "/marketmng/theme/view?action=update&code=" + formData.code;
        this.getPage(option, function () {
            var $ = arguments[0];
            var oldData = $("#myform").serialize();
            var dataObj = urlencode.parse(oldData);

            if (callback) callback(dataObj);
        });
    },
    add: function (data) {
        var self = this;
        //遍历本地dist下面的项目文件夹
        if (data.length != 0) {
            data.forEach(function (item, index) {
                formData["jsResource[" + index + "].themePlatform"] = item.name;
                formData["jsResource[" + index + "].url"] = item.url;
            });

            formData["cssResource[0].themePlatform"] = "H5";
            formData["cssResource[0].url"] = "https://ami-static.b0.upaiyun.com/active2016/base/hack1Px.css";
        }

        var path = "/marketmng/theme/save?action=add";
        this.postForm(formData, path, function () {
            console.log();
            console.log(chalk.green("   # 新增主题成功"));



            self.list()
        });
    },
    update: function (code, data) {
        var self = this;
        self.detail(function () {

            var oldData = arguments[0];
            var newData = {};
            for (var k in oldData) {
                newData[k] = oldData[k]
            }

            if (data.length != 0) {
                data.forEach(function (item, index) {
                    newData["jsResource[" + index + "].themePlatform"] = item.name;
                    newData["jsResource[" + index + "].url"] = item.url;
                })
            }


            //开始写入
            var path = "/marketmng/theme/save?action=update&code=" + code;
            self.postForm(newData, path, function () {
                console.log();
                console.log();
                console.log(chalk.green("   # 更新主题成功"));
                console.log();
                console.log();

                self.list();
            });
        });

    }
};


module.exports = theme;