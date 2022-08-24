const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const getToken = async (id) => {
  const token = await promisify(jwt.sign)({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const logUserIn = catchAsync(async (user, statusCode, res) => {
  //cria token do usuario
  const token = await getToken(user.id);

  //configura o cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //converte dias em ms
    ),
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //não mostra campos secretos na res
  user.password = undefined;
  user.active = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

exports.signUp = catchAsync(async (req, res, next) => {
  //destrincha os dados que são usados para criar o usuario
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  logUserIn(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('Enter email and password', 400));

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePasswords(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  logUserIn(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  //CHECK if authorization token has been sent
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You need to be logged in to have access', 401));
  }

  //CHECK if token is valid and not expired
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //CHECK if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError('The user associated to this token no longer exists.', 401)
    );
  }

  //CHECK if user hasn't changed password
  if (await user.changedPassword(decoded.iat)) {
    return next(
      new AppError('User password has changed. Please log in again.', 401)
    );
  }

  //TD certo e daí passa os dados do user adiante
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //VERIFICA se o email existe
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email', 404));
  }

  //GERA o token de reset e salva no user
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  //PREPARA pra enviar o token
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetUrl}\nIf you didn't required a password change, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Natours password reset (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Reset link was sent to your email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(err);

    return next(
      new AppError(
        'There was an error sending the email. Please try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //PEGAR o user pelo token que a data ainda não expirou
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expirated', 400));
  }

  //SETAR nova senha
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //LOGAR o user
  logUserIn(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //GET user logged
  const user = await User.findById(req.user.id).select('+password');
  if (!user)
    return next(
      new AppError(
        'There is an error with your credentials. Please log in again',
        401
      )
    );

  //AQUI N VERIFICA SE OS DADOS FORAM INFORMADOS / IF?
  //CHECK provided password
  if (!(await user.comparePasswords(req.body.currentPassword)))
    return next(new AppError('Incorrect password', 401));

  //UPDATE password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  //LOGAR o user com a senha nova
  logUserIn(user, 200, res);
});
