const { Transform } = require('stream');
const { Console } = require('console');
const chalk = require('chalk');
/**
 *
 * @param { Array } input 输出表格数组数据
 */
function ConsoleTable(input) {
	const ts = new Transform({
		transform(chunk, enc, cb) {
			cb(null, chunk);
		},
	});
	const logger = new Console({
		stdout: ts,
	});
	logger.table(input);
	const table = (ts.read() || '').toString();
	let result = '';
	for (let row of table.split(/[\r\n]+/)) {
		let r = row.replace(/[^┬]*┬/, '┌');
		r = r.replace(/^├─*┼/, '├');
		r = r.replace(/│[^│]*/, '');
		r = r.replace(/^└─*┴/, '└');
		r = r.replace(/'/g, ' ');
		result += `${r}\n`;
	}
	console.log(chalk.cyan(result));
}
/**
 *
 * @param { Object } data 对象
 * @param  {...any} arg 需要过滤属性
 * @returns 新对象
 */
function filterObjParams(data, ...arg) {
	let res = {
		...data,
	};
	for (const key of arg) {
		delete res[key];
	}
	return res;
}
/**
 *
 * @param {*} err 错误收集
 */
function errorFn(err) {
	if (err.isOperational) {
		console.log(chalk.red(err.message));
	} else {
		console.log(chalk.red(err));
	}
}
/**
 * @description 异步函数错误收集统一处理
 * @param {*} fn 异步函数
 * @returns
 */
function catchAsync(fn) {
	return (...arg) => {
		fn(...arg).catch(errorFn);
	};
}
module.exports = {
	ConsoleTable,
	filterObjParams,
	catchAsync,
};
