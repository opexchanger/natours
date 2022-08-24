const AppError = require('../utils/appError');

//ENVIANDO ERRO PRO DESENVOLVEDOR
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

//ENVIANDO ERRO PRO CLIENTE
const sendErrorProd = (err, res) => {
  //SE FOR UM DOS NOSSOS 'ERROS PREVISTOS'
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //SE FOR ERRO DESCONHECIDO
  } else {
    console.log('ERROR: ', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong with the server',
    });
  }
};

const handleCastErrorDB = (err) => {
  return new AppError(
    `Invalid ${err.path}: ${err.value}. Type accepted: ${err.kind}`,
    400
  );
};

const handleValidationErrorDB = (err) => {
  return new AppError(err.message, 400);
};

const handleDuplicateKeyDB = (err) => {
  const value = Object.values(err.keyValue)[0];
  const key = Object.keys(err.keyValue)[0];
  return new AppError(
    `Duplicated ${key} value: ${value}. Use another value.`,
    400
  );
};

const handleInvalidJWT = () =>
  new AppError('Invalid token signature. Please log in again.', 401);

const handleExpiredJWT = () =>
  new AppError('Your token has expired. Please log in again.', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //CÓPIA DO OBJETO ERR (A PARTIR DE AGORA USAMOS ERROR)
    let error = { ...err };
    error.name = err.name;

    console.log(error.name);

    //SWITCH(?)
    if (error.name === 'CastError') error = handleCastErrorDB(err);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (error.name === 'MongoError' && error.code === 11000)
      error = handleDuplicateKeyDB(err);
    if (error.name === 'JsonWebTokenError') error = handleInvalidJWT();
    if (error.name === 'TokenExpiredError') error = handleExpiredJWT();

    sendErrorProd(error, res);
  }
};
