#!/usr/bin/env node
const path = require('path');
const download = require('download-git-repo');
const program = require('commander');
const chalk = require('chalk');
const rm = require('rimraf').sync;
const exists = require('fs').existsSync;
const ora = require('ora');
const inquirer = require('inquirer')


/*
 * usage & format arguments
 * */
program
    .usage('<template-name> <project-name>')
    .parse(process.argv);


/*
 help
 */
program.on('--help', function () {
    console.log(' Examples:');
    console.log();
    console.log(chalk.gray('    # create a new front-end frame'))
    console.log(chalk.green('   $ chrys init website my-project or $ chrys init react my-project'))
    console.log()
});

/*
 * hint
 * */
if (program.args.length < 2) return program.help();

/*template name*/
let template = program.args[0];

/*project name*/
let projectName = program.args[1];

/*dist*/
let to = path.resolve(projectName);

console.log();
process.on('exit', function () {
    console.log();
});

/*ask user override?*/
if (exists(to)) {
    inquirer.prompt([{
        type: 'confirm',
        message: '文件夹存在，是否覆盖？',
        name: 'ok'
    }]).then(answers => {
        if (answers.ok) {
            run()
        }
    })
} else {
    run()
}

/*download template*/
function run() {
    const spinner = ora('downloading template')
    if (exists(to)) rm(to);
    download(`Chryseis/chrys-${template}-template`, to, {clone: false}, function (err) {
        spinner.stop()
        if (err) {
            console.log(chalk.red('download error!'));
            process.exit(1);
        }
        console.log(chalk.green('    download success!'));
        console.log(chalk.green(`    plz cd  ${to}`));
        console.log(chalk.green('    $npm install '));
        console.log(chalk.green('    $npm start '));
    })
}