const https = require('node:https');
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
					data.obj = { key: 1 };
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
module.exports = {
	getGitReposList,
};
