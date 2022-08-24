class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    //para a captura do stacktrace no momento da chamada desse construtor
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
