const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review must not be empty'],
    minlength: 4,
    maxlength: 2000,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must have an author (user)'],
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour'],
  },
});

//indice unico 1 user só poder fazer review de 1 tour uma vez
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

//QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  //o this vai se referir a query atual
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

//calcula total e média das reviews pertencentes a certo tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //o this dentro de uma função estática aponta o model e por isso podemos usar o aggregate
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: null,
    });
  }
};

//Dps de salvar uma nova review chama a função p calcular total e média
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

//antes de atualizar ou deletar
//Os métodos findByIdAnd... apontam no fim pra um findOneAnd
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //pegar o documento(review) que está sendo mexido
  //na query midw só temos acesso a query ent executamos ela p obter o doc
  this.r = await this.findOne();
  //passamos o doc pela query que dai o post pode pegar
  next();
});

//dps de atualizar ou deletar
reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
