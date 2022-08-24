const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

//TODO FUNÇÃO DUPLICADA QUE TEM TAMBÉM EM USERCONTROLLER
const filterObj = (obj, ...filters) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (filters.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);

exports.filterBody = (req, res, next) => {
  //WTF pq eu to filtrando o body antes de um create? n lembro
  const filteredBody = filterObj(req.body, 'review', 'rating', 'tour');
  if (req.params.tourId) filteredBody.tour = req.params.tourId;
  filteredBody.user = req.user.id;

  //passa adiante o body filtrado
  req.body = filteredBody;
  next();
};

//TODO restringir user a mexer apenas nas próprias reviews

exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
