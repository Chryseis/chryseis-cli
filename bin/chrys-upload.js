#!/usr/bin/env node
var ftp = require('ftp');
var upyun = require('upyun');
var program = require('commander');
var chalk = require('chalk');
var ora = require('ora');
var home = require('user-home');
var fs = require('fs');
var walk = require("walk");
var path = require("path");
var pkg = require(process.cwd() + '/package.json');
var c = new ftp();

program.usage('<upload-server> [upload-dir]');

const jsServerUrl = "http://192.168.2.140/html/";
const jsFileList = [];

/*
 * Help
 * */

program.on('--help', function () {
    console.log(' 案例:');
    console.log();
    console.log(chalk.grey('    # 指定需要上传的服务器和文件夹'));
    console.log(chalk.green('    $ yc upload test dist  or  $ yc upload upyun dist'))
    console.log()
});

program.parse(process.argv);
if (program.args.length < 1)
    return program.help();
var serverName = program.args[0];
var isSubmitUpyun = program.args[2] || true;
var uploadConfig;
if (serverName == "test") {
    uploadConfig = pkg.testServer;

    listLocalDir(function (files, dirs) {
        c
            .on('ready', function () {

                var len = dirs.length;
                var i = 1;

                //创建文件夹
                dirs.forEach(function (item) {
                    c
                        .mkdir(item, true, function (err, dir) {
                            if (err)
                                throw err;
                            i++;
                            if (i == len) {
                                uploadFile(files, c);
                            }
                            c.end();
                        });
                });
            });

        //FTP建立连接
        c.connect({host: uploadConfig.host, user: uploadConfig.user, password: uploadConfig.pwd});
    });

} else {
    uploadConfig = pkg.upyunServer;

    listLocalDir(function (files, dirs) {
        var bucket = new upyun.Bucket(uploadConfig.bucket, uploadConfig.user, uploadConfig.password);
        //初始化upYun
        var client = new upyun.Client(bucket);

        var fLen = files.length;
        var n = 0;
        var jsPathArr = [];
        //上传文件
        files.forEach(function (item) {
            var subPath = program.args[1] ? item.replace(program.args[1], "") : item.replace(/\/dist/, "");
            var rPath = `${uploadConfig.target}${subPath}`;

            var filePath = path.join(process.cwd(), item);

            var imgReg = /\.(jpg|png|gif|jpeg)$/gi;
            var isImg = imgReg.test(filePath);

            var jsReg = /\.js$/gi;
            var isJs = jsReg.test(filePath);

            if (isJs) {
                jsPathArr.push(rPath);
            }

            if (isImg) {

                fs
                    .readFile(filePath, function (err, data) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        //上传图片
                        client
                            .putFile(rPath, data)
                            .then(function (v) {
                                n++;
                                if (n == fLen) {
                                    console.log();
                                    console.log(chalk.green("  # 上传又拍云成功"));
                                    console.log();
                                    console.log(chalk.gray(`   CSS文件`));
                                    console.log(chalk.white(`   http://ami-static.b0.upaiyun.com/active2016/base/hack1Px.css`));

                                    console.log();
                                    console.log(chalk.gray(`   JS文件`));
                                    console.log(chalk.white(`   https://ami-static.b0.upaiyun.com/active2016/base/flexible.js`));

                                    jsPathArr.forEach(function (item) {
                                        console.log(chalk.white(`   https://ami-static.b0.upaiyun.com${item}`));
                                    });

                                    console.log();

                                    var formData = [
                                        {
                                            type: "Js",
                                            name: "H5",
                                            url: "https://ami-static.b0.upaiyun.com/active2016/base/flexible.js"
                                        }
                                    ];

                                    if (pkg.isPC) {

                                        jsPathArr.forEach(function (item) {
                                            let obj = {};
                                            if (item.match("app.js") != null) {
                                                obj.name = "H5"
                                            } else {
                                                obj.name = "PC"
                                            }
                                            obj.type = `Js`;
                                            obj.url = `https://fuckyourmother.com${item}`;

                                            formData.push(obj);
                                        })

                                    } else {
                                        var obj = {};
                                        obj.name = "H5";
                                        obj.url = `https://fuckyourmother.com${jsPathArr[0]}`;
                                        formData.push(obj);
                                    }

                                    if (isSubmitUpyun) {
                                        require('../lib/submit.js').init(formData);
                                    }
                                }
                            });
                    });
            } else {

                fs
                    .readFile(filePath, {
                        flag: 'r+',
                        encoding: 'utf8'
                    }, function (err, data) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        //上传JS HTML CSS文件
                        client
                            .putFile(rPath, data)
                            .then(function (v) {
                                n++;
                                if (n == fLen) {
                                    console.log();
                                    console.log(chalk.green("  # 上传又拍云成功"));
                                    console.log();
                                    console.log(chalk.gray(`   CSS文件`));
                                    console.log(chalk.white(`   http://ami-static.b0.upaiyun.com/active2016/base/hack1Px.css`));

                                    console.log();
                                    console.log(chalk.gray(`   JS文件`));
                                    console.log(chalk.white(`   https://ami-static.b0.upaiyun.com/active2016/base/flexible.js`));

                                    jsPathArr.forEach(function (item) {
                                        console.log(chalk.white(`   https://fuckyourmother.com${item}`));
                                    });

                                    console.log();

                                    var formData = [
                                        {
                                            type: "Js",
                                            name: "H5",
                                            url: "https://ami-static.b0.upaiyun.com/active2016/base/flexible.js"
                                        }
                                    ];

                                    if (pkg.isPC) {

                                        jsPathArr.forEach(function (item) {
                                            let obj = {};
                                            if (item.match("app.js") != null) {
                                                obj.name = "H5"
                                            } else {
                                                obj.name = "PC"
                                            }
                                            obj.type = `Js`;
                                            obj.url = `https://fuckyourmother.com${item}`;

                                            formData.push(obj);
                                        })

                                    } else {
                                        var obj = {};
                                        obj.name = "H5";
                                        obj.url = `https://fuckyourmother.com${jsPathArr[0]}`;
                                        formData.push(obj);
                                    }

                                    if (isSubmitUpyun) {
                                        require('../lib/submit.js').init(formData);
                                    }
                                }
                            });

                    });

            }

        });

    });
}

//FTP上传到140
function uploadFile(data, c) {
    let unique = 1;
    console.log();

    data.forEach(function (item) {
        var currentFilePath = `.${item}`;

        var hPath = program.args[1] || "/dist";

        var descFilePath = item.replace(hPath, ".");

        if (descFilePath.match("js") != null) {
            jsFileList.push(descFilePath.substring(2));
        }
        c
            .put(currentFilePath, descFilePath, function (err, file) {
                if (err)
                    throw err;
                unique++;

                if (unique == data.length) {
                    console.log(chalk.green(`   # 文件上传成功`));

                    console.log();
                    console.log(chalk.gray(`   CSS文件`));
                    console.log(chalk.white(`   http://ami-static.b0.upaiyun.com/active2016/base/hack1Px.css`));

                    console.log();
                    console.log(chalk.gray(`   JS文件`));
                    console.log(chalk.white(`   https://ami-static.b0.upaiyun.com/active2016/base/flexible.js`));

                    jsFileList.forEach(function (item) {
                        console.log(chalk.white(`   ${jsServerUrl}${item}`));
                    });

                    var formData = [
                        {
                            type: "Js",
                            name: "H5",
                            url: "https://ami-static.b0.upaiyun.com/active2016/base/flexible.js"
                        }
                    ];

                    if (pkg.isPC) {

                        jsFileList
                            .forEach(function (item) {
                                let obj = {};
                                if (item.match("app.js") != null) {
                                    obj.name = "H5"
                                } else {
                                    obj.name = "PC"
                                }
                                obj.type = `Js`;
                                obj.url = `${jsServerUrl}${item}`;

                                formData.push(obj);
                            })

                    } else {
                        var obj = {};
                        obj.name = "H5";
                        obj.url = `${jsServerUrl}${jsFileList[0]}`;
                        formData.push(obj);
                    }
                    isSubmitUpyun && require('../lib/submit.js').init(formData);

                }
                c.end();
            });
    });

}

function listLocalDir(callback) {

    var root = process.cwd();
    var sourceDir = path.join(root, program.args[1] || '/dist');

    const files = [];
    const dirs = [];
    var walker = walk.walk(sourceDir, {followLinks: true});

    walker.on('file', function (roots, stat, next) {
        var dPath = roots + '/' + stat.name;
        dPath = dPath.replace(process.cwd(), "");
        var filePath = dPath.replace(/\\/g, "/");
        files.push(filePath);
        next();
    });

    walker.on('directory', function (roots, stat, next) {
        var dPath = roots + `\\` + stat.name;
        dPath = dPath.replace(sourceDir, "");
        dPath = dPath.replace(/\\/g, "/");
        dirs.push(dPath);
        next();
    });

    walker.on('end', function () {
            if (files.length == 0 && dirs.length == 0) {
                console.log(chalk.red('当前目录dist文件夹为空或不存在'));
                return;
            }

            if (callback)
                callback(files, dirs);

        }
    );

}