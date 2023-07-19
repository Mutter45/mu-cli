const { Transform } = require('stream');
const { Console } = require('console');
const chalk = require('chalk');
function ConsoleTable(input) {
	const ts = new Transform({
		transform(chunk, enc, cb) {
			cb(null, chunk);
		},
	});
	const logger = new Console({ stdout: ts });
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
function filterObjParams(data, ...arg) {
	let res = { ...data };
	for (const key of arg) {
		delete res[key];
	}
	return res;
}
module.exports = {
	ConsoleTable,
	filterObjParams,
};
