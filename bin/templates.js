const { getGitReposList } = require('./api');
// console.log(getGitReposList);
module.exports = [
	{
		name: '默认',
		value: '',
	},
	{
		name: 'react-demo',
		value: 'git@github.com:Mutter45/react-demo.git',
	},
	{
		name: 'snake',
		value: 'git@github.com:Mutter45/snake.git',
	},
];
