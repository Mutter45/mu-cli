#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const downloadGitRepo = require('download-git-repo');
const ora = require('ora');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');
const templates = require('./templates');
const { getGitReposList } = require('./api');
const { ConsoleTable, filterObjParams } = require('./utils');
const package = require('../package.json');

/**
 * 当前脚手架版本
 */
program.version(`v${package.version}`);

program
	.command('create [projectName]')
	.description('创建模版')
	.option('-t --template <template>', '模板名称')
	.action(async (projectName, option) => {
		// 获取模板类型
		const project = templates.find((item) => item.name === option.template);
		const loading = ora({
			text: '正在获取模板列表。。。',
			color: 'magenta',
		});
		loading.start();
		const { data } = await getGitReposList('Mutter45');
		loading.stop();
		templates = data;
		let projectTemplate = project ? project.value : undefined;
		if (!projectName) {
			const { name } = await inquirer.prompt({
				type: 'input',
				name: 'name',
				message: '请输入项目名称',
			});
			if (!name) {
				console.log(chalk.red('项目名称不能为空'));
				process.exit(1);
			}
			projectName = name;
		}
		if (!projectTemplate) {
			const { template } = await inquirer.prompt({
				type: 'list',
				name: 'template',
				message: '请选择类型模板',
				choices: templates,
			});
			projectTemplate = template;
		}
		// 目标文件夹 = 用户命令行所在目录 + 项目名称
		const dest = path.join(process.cwd(), projectName);
		// 判断是否存在相同文件夹
		if (fs.existsSync(dest)) {
			const { isCover } = await inquirer.prompt({
				type: 'confirm',
				name: 'isCover',
				message: '目录已存在，是否覆盖？',
			});
			// 如果覆盖就删除文件夹继续往下执行，否的话就退出进程
			isCover ? fs.removeSync(dest) : process.exit(1);
		}
		// 加载下载loading
		loading.start();
		downloadGitRepo(`direct:${projectTemplate}#main`, dest, { clone: true }, async function (err) {
			if (err) {
				loading.fail('创建模板失败' + err.message);
				return;
			}
			loading.succeed('创建模板成功');
			console.log('下载模板成功', dest);
			// 添加引导信息(每个模版可能都不一样，要按照模版具体情况来)
			// 读取下载模板package.json文件并进行引导操作
			// const packageInfo = await fs.readFile(`${dest}/package.json`, 'utf8');
			console.log(chalk.green(`\ncd ${projectName}`));
			console.log(chalk.green('npm install'));
			console.log(chalk.green('npm run dev\n'));
			// 进入模板文件夹
			// execSync(`cd ${dest}`);
			// execSync(`npm i`);
			// execSync(`npm run dev`);
		});
	});
program.on('--help', () => {});
program.option('-l, --list', '查看模板列表').action(async () => {
	const loading = ora({
		text: '正在获取模板列表。。。',
		color: 'magenta',
	});
	loading.start();
	const { data } = await getGitReposList('Mutter45');
	loading.stop();
	// 去除fork项目
	const selfBuildList = data.filter((item) => item.fork);
	const list = selfBuildList.map((item) => {
		const res = filterObjParams(item, 'default_branch', 'fork');
		return res;
	});
	console.log(chalk.cyan('模板列表如下:'));
	ConsoleTable(list);
});

/**
 * 解析用户执行命令传入参数
 */
program.parse(process.argv);
