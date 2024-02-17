#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const downloadGitRepo = require('download-git-repo');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { getGitReposList, checkGithubUser } = require('./api');
const { ConsoleTable, filterObjParams, catchAsync } = require('./utils');
const AppError = require('./appError');
const package = require('../package.json');
const info = require('./info.json');
// const { execSync } = require('child_process');
const loading = ora({
	color: 'cyan',
});

/**
 *
 * @param {*} type 筛选类型 u|t
 * @param {*} name github仓库使用者名称
 * @returns {Array} list
 */
const filterTypeList = (type, name) => {
	const obj = {
		async u() {
			const list = info.USERLIST.map((item) => {
				let obj = { ...item };
				obj.createTime = new Date(item.createTime).toLocaleDateString();
				obj.isUse = info.DEFAULTEMPLATE === item.user ? 'YES' : 'NO';
				return obj;
			});
			return list;
		},
		async t(name) {
			const { data } = await getGitReposList(name);
			// 去除fork项目
			const selfBuildList = data.filter((item) => !item.fork);
			const list = selfBuildList.map((item) => {
				const res = filterObjParams(item, 'default_branch', 'fork');
				return res;
			});
			return list;
		},
	};
	return obj[type](name);
};

// 查看用户，模板列表 回调函数
const commaSeparatedList = async (value) => {
	console.log(value, '-----------------');
	if (!value.list) return;
	const typeObj = {
		t: '模板',
		u: '用户',
	};
	// 参数可能不存在需要处理
	const type = value.list === true ? 't' : value.list;
	loading.start(`正在获取${typeObj[type]}列表...`);
	const list = await filterTypeList(type, info.DEFAULTEMPLATE);
	loading.stop();
	if (!list.length) {
		// 抛出可展示错误
		throw new AppError(`暂无${typeObj[type]}列表`);
	}
	//控制台输出可下载模板列表
	console.log(chalk.cyan(`${typeObj[type]}列表如下:`));
	ConsoleTable(list);
};
/**
 * 当前脚手架版本
 */
program.version(`v${package.version}`, '-v, --vers', '查看版本');

program
	.command('create [projectName]')
	.description('创建模版')
	.option('-t --template <template>', '模板名称')
	.action(
		catchAsync(async (projectName, option) => {
			// 获取模板类型
			loading.start('正在获取模板列表...');
			const { data } = await getGitReposList(info.DEFAULTEMPLATE);
			loading.stop();
			// 去除fork项目
			const selfBuildList = data.filter((item) => !item.fork);
			const project = selfBuildList.find((item) => item.name === option.template);
			let projectTemplate = project ? project.value : undefined;
			if (!projectName) {
				const { name } = await inquirer.prompt({
					type: 'input',
					name: 'name',
					message: '请输入项目名称',
				});
				if (!name) {
					// 抛出可展示错误
					throw new AppError('项目名称不能为空');
				}
				projectName = name;
			}
			if (!projectTemplate) {
				const { template } = await inquirer.prompt({
					type: 'list',
					name: 'template',
					message: '请选择类型模板',
					choices: selfBuildList,
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
			loading.start('正在下载模板...');
			console.log(projectTemplate);
			// 确定默认分支
			const curProject = selfBuildList.find((item) => item.value === projectTemplate);
			downloadGitRepo(`direct:${projectTemplate}#${curProject.default_branch}`, dest, { clone: true }, async function (err) {
				if (err) {
					loading.fail('创建模板失败' + err.message);
					return;
				}
				loading.succeed('创建模板成功');
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
		})
	);

program.option('-l, --list [name]', '查看用户，模板列表 u|t ').action(catchAsync(commaSeparatedList));
/**
 * 设置用户 获取github对应用户模板
 */
program
	.command('user [userName]')
	.alias('u') //缩写
	.description('设置用户(github用户名)')
	.action(
		catchAsync(async (userName, option) => {
			const isToggle = info.USERLIST.some(({ user }) => user === userName);
			// 如果为新增用户
			if (!isToggle) {
				const { id } = await checkGithubUser(userName);
				if (!id) {
					throw new AppError(`github不存在该用户: ${userName}`);
				}
				const data = {
					id,
					user: userName,
					createTime: Date.now(),
				};
				info.USERLIST.unshift(data);
			}
			// 默认用户不改变不进行操作
			if (info.DEFAULTEMPLATE !== userName) {
				info.DEFAULTEMPLATE = userName;
				await fs.writeFile(`${__dirname}\\info.json`, JSON.stringify(info));
			}
			console.log(chalk.cyan(`${isToggle ? '切换' : '设置'}模板用户成功: ${userName}`));
		})
	);
/**
 * 错误后显示帮助
 */
program.showHelpAfterError('add --help for additional information');

/**
 * 解析用户执行命令传入参数
 */
program.parse(process.argv);
