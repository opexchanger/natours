const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The name is required'],
    trim: true,
    maxlength: [40, 'The name must not exceed 40 characters'],
    minlength: [2, 'The name must contain at least 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'The email is required'],
    trim: true,
    unique: [true, "There's already an account associated to this email"],
    lowercase: true,
    validate: [validator.isEmail, 'Email format is not valid'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'The password is required'],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Passoword confirmation required'],
    minlength: 8,
    //Validação só ocorre nos métodos SAVE e CREATE
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "The passwords didn't matched",
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  //Se a senha não foi modifica manda seguir
  if (!this.isModified('password')) return next();
  //encripta a senha
  this.password = await bcrypt.hash(this.password, 12);
  //remove a confirmação que não vai pro bd
  this.confirmPassword = undefined;
  //segue o baile
  next();
});

//seta automatico a data de alteração da senha
userSchema.pre('save', function (next) {
  //VERIFICA se a senha foi alterada
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //DELAY pra n atrapalhar com a produção do token
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.comparePasswords = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.log('ERROR ', err.message);
  }
};

userSchema.methods.changedPassword = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return changedTimestamp > JWTTimestamp;
  }

  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
