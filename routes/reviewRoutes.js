const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//A ROTA É CHAMADA A PARTIR DE /TOURS E O MERGEPARAMS DEIXA OS PARAMS Q ELA TINHA QDO FEZ O REDIREC.
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.filterBody,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('admin', 'user'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview
  );

module.exports = router;
