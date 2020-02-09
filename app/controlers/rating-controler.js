'use strict';
var HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const { Plates, User,Review, AggregateReview, PlateImage, ReceiptImage, KitchenImage, Documents } = require('../models/index');
const repository = require('../repository/rating-repository');
const authService = require('../services/auth');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const path = require('path')
const reviewConstants = require(path.resolve('app/constants/reviews'));
const FCM = require('../services/fcm')
const asyncHandler = require('express-async-handler');


exports.getRating = asyncHandler(async (req, res, next) => {

  if(req.params.review_type == reviewConstants.REVIEW_TYPE_PLATE){
    try {
      let rating = await repository.getRatingofPlate(req.params.id);
      let aggregate_rating = rating.rating+'('+rating.userCount+')'
      res.status(HttpStatus.ACCEPTED).send({
        message: 'aggregate rating of plate!',
        aggregate_rating:aggregate_rating,
        data: rating
      });
      return 0;
    } catch (e) {
      console.log(e)
      res.status(HttpStatus.CONFLICT).send({
        message: 'Fail to get the rating',
        error: true
      });
      return 0;
    }
  }

  else if(req.params.review_type == reviewConstants.REVIEW_TYPE_CHEF){
    try {
      let rating = await repository.getRatingofChef(req.params.id);
      let aggregate_rating = rating.rating+'('+rating.userCount+')'
      res.status(HttpStatus.ACCEPTED).send({
        message: 'aggregate rating of chef!',
        aggregate_rating:aggregate_rating,
        data: rating
      });
      return 0;
    } catch (e) {
      console.log(e)
      res.status(HttpStatus.CONFLICT).send({
        message: 'Fail to get the rating',
        error: true
      });
      return 0;
    }
  }

  else if(req.params.review_type == reviewConstants.REVIEW_TYPE_DRIVER){
    try {
      let rating = await repository.getRatingofDriver(req.params.id);
      let aggregate_rating = rating.rating+'('+rating.userCount+')'
      res.status(HttpStatus.ACCEPTED).send({
        message: 'aggregate rating of driver!',
        aggregate_rating:aggregate_rating,
        data: rating
      });
      return 0;
    } catch (e) {
      console.log(e)
      res.status(HttpStatus.CONFLICT).send({
        message: 'Fail to get the rating',
        error: true
      });
      return 0;
    }
  }


});


exports.postRating = asyncHandler(async (req, res, next) => {

  if(req.body.review_type == reviewConstants.REVIEW_TYPE_CHEF){
    try {
      let chefID = req.body.chefID;

      let createreview = {};
      createreview.userId = req.userId;
      createreview.rating = req.body.rating;
      createreview.comment = req.body.comment;
      createreview.review_type = req.body.review_type;
      createreview.chefID = req.body.chefID;

      const review = await Review.create(createreview);

      let sumUser = await Review.count({

        where:{chefID:chefID}

      })

      let sumRating = await Review.sum('rating', {

        where:{chefID:chefID}

      })

      let aggr_item = {};
      aggr_item.review_type = reviewConstants.REVIEW_TYPE_CHEF;
      aggr_item.chefID = chefID;
      aggr_item.userCount = sumUser;
      aggr_item.rating = (sumRating/sumUser).toFixed(1);


      const foundChef = await AggregateReview.findOne({where:{chefID:chefID}});
      if (!foundChef) {
        await AggregateReview.create(aggr_item)
      }
      else await AggregateReview.update(aggr_item, {where:{chefID:chefID}});

      /*Chef Receives fcm notification for Rating*/



      let chefDeviceId = await User.findOne({where: {id: chefID } ,
        attributes:['device_id']
      })
      let notificationResponse
      if(chefDeviceId) {

        let fcmOrderDetails = {
          orderTitle: 'Review received',
          orderBrief: `${createreview.comment} :Rating: ${createreview.rating}`,
          activity: req.body.review_type,
          device_id: [chefDeviceId.device_id]  // Need to pass token/deviceID as an array
        }
        notificationResponse = await FCM(fcmOrderDetails)

        /*Chef Receives fcm notification for ratings*/

      }
      res.status(HttpStatus.ACCEPTED).send({
        message: 'review created for chef!',
        data: review,
        notification: notificationResponse?notificationResponse:"DeviceId Not found"
      });
      return 0;
    } catch (e) {
      console.log(e)
      res.status(HttpStatus.CONFLICT).send({
        message: 'Fail to post review',
        error: true
      });
      return 0;
    }
  }

  else if(req.body.review_type == reviewConstants.REVIEW_TYPE_DRIVER){
    try {
      let driverID = req.body.driverID;

      let createreview = {};
      createreview.userId = req.userId;
      createreview.rating = req.body.rating;
      createreview.comment = req.body.comment;
      createreview.review_type = req.body.review_type;
      createreview.driverID = req.body.driverID;

      const review = await Review.create(createreview);

      let sumUser = await Review.count({

        where:{driverID:driverID}

      })

      let sumRating = await Review.sum('rating', {

        where:{driverID:driverID}

      })

      let aggr_item = {};
      aggr_item.review_type = reviewConstants.REVIEW_TYPE_DRIVER;
      aggr_item.driverID = driverID;
      aggr_item.userCount = sumUser;
      aggr_item.rating = (sumRating/sumUser).toFixed(1);


      const foundDriver = await AggregateReview.findOne({where:{driverID:driverID}});
      if (!foundDriver) {
        await AggregateReview.create(aggr_item)
      }
      else await AggregateReview.update(aggr_item, {where:{driverID:driverID}});

      res.status(HttpStatus.ACCEPTED).send({
        message: 'review created for driver!',
        data: review
      });
      return 0;
    } catch (e) {
      console.log(e)
      res.status(HttpStatus.CONFLICT).send({
        message: 'Fail to post review',
        error: true
      });
      return 0;
    }
  }
});
