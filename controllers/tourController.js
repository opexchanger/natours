const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//middleware for alias routes
exports.aliasTopAndCheap = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,difficulty,duration';
  next();
};

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $group: {
        _id: '$difficulty',
        totalTours: { $sum: 1 },
        ratingsAvg: { $avg: '$ratingsAverage' },
        priceAvg: { $avg: '$price' },
        totalRatings: { $sum: '$ratingsQuantity' },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    //UNWIND
    {
      $unwind: '$startDates',
    },
    //MATCH
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    //GROUP
    {
      $group: {
        _id: { $month: '$startDates' },
        totalResults: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    //ADD FIELDS
    {
      $addFields: {
        month: '$_id',
      },
    },
    //PROJECT
    {
      $project: {
        _id: 0,
      },
    },
    //SORT
    {
      $sort: {
        month: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
