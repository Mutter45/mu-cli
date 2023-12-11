class AppError extends Error {
	constructor(message) {
		super(message);
		this.isOperational = true; // 用户操作错误提示
		Error.captureStackTrace(this, this.constructor);
	}
}
module.exports = AppError;
