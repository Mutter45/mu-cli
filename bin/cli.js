#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const downloadGitRepo = require('download-git-repo');
const ora = require('ora');
const { execSync } = require('child_process');
const path = require('path');
const templates = require('./templates');
const package = require('../package.json');

const loading = ora('正在下载模板。。。');

/**
 * 当前脚手架版本
 */
program.version(`v${package.version}`);

program
	.command('create')
	.description('创建模版')
	.action(async () => {
		const { name } = await inquirer.prompt({
			type: 'input',
			name: 'name',
			message: '请输入项目名称',
		});
		if (!name) {
			throw Error('项目名称不能为空');
		}
		const { template } = await inquirer.prompt({
			type: 'list',
			name: 'template',
			message: '请选择类型模板',
			choices: templates,
		});
		console.log('模板项目地址：', template);
		console.log('项目文件夹：', name);
		// 目标文件夹 = 用户命令行所在目录 + 项目名称
		const dest = path.join(process.cwd(), name);
		console.log(dest);
		// 加载下载loading
		loading.start();
		downloadGitRepo(`direct:${template}#main`, dest, { clone: true }, function (err) {
			if (err) {
				loading.fail('创建模板失败' + err.message);
				return;
			}
			loading.succeed('创建模板成功');
			console.log('下载模板成功', dest);
			// 进入模板文件夹
			// execSync(`cd ${dest}`);
			// execSync(`npm i`);
			// execSync(`npm run dev`);
		});
	});
program.on('--help', () => {});
program.command('*').action(async () => {
	console.log('请输入 -h 查看所有命令行工具');
});

/**
 * 解析用户执行命令传入参数
 */
program.parse(process.argv);

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
//  });
// rl.question('你来自哪里？ ',answer=>{
//   console.log(answer)
//   process.exit(0) //结束进程
// });
