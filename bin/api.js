const https = require('node:https');
/**
 *
 * @param {*} userName github账户名
 * @returns Promise 获取该用户所有公开仓库信息
 */
const getGitReposList = (userName) => {
	// {?type,page,per_page,sort}
	return new Promise((resolve, reject) => {
		https.get(
			`https://api.github.com/users/${userName}/repos`,
			{
				headers: {
					'User-Agent': userName,
				},
			},
			(res) => {
				let data = '';
				res.on('data', (chunk) => {
					data += chunk.toString();
				});
				res.on('end', () => {
					const list = JSON.parse(data).map((item) => {
						return {
							// 组合成模版所需要的name，value结构
							name: item.name,
							value: item.clone_url,
							default_branch: item.default_branch,
							fork: item.fork,
						};
					});
					resolve({
						data: list,
						total: list.length,
					});
				});
				res.on('error', (error) => {
					console.log(error.message);
					reject(error.message);
				});
			}
		);
	});
};
/**
 *
 * @param {*} userName 账户姓名
 * @returns Promise 检验添加guthub用户是否正确
 */
const checkGithubUser = (userName) => {
	return new Promise((resolve, reject) => {
		https.get(
			`https://api.github.com/users/${userName}`,
			{
				headers: {
					'User-Agent': userName,
				},
			},
			(res) => {
				let data = '';
				res.on('data', (chunk) => {
					data += chunk.toString();
				});
				res.on('end', () => {
					resolve({
						...JSON.parse(data),
					});
				});
				res.on('error', (error) => {
					console.log(error.message);
					reject(error.message);
				});
			}
		);
	});
};
module.exports = {
	getGitReposList,
	checkGithubUser,
};
