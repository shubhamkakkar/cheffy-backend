'use strict';
var HttpStatus = require('http-status-codes');
const { Plates, User,Review, AggregateReview, PlateImage, ReceiptImage, KitchenImage, Documents } = require('../models/index');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const path = require('path')
const reviewConstants = require(path.resolve('app/constants/reviews'));


exports.getRatingofPlate = async (id) => {

  try {
      const rating = await AggregateReview.findOne({
        where:{
          review_type:reviewConstants.REVIEW_TYPE_PLATE, 
          plateId:id
        }
        
      });
      return rating;
    } catch (e) {
      console.log(e)
      throw e;
    }
};

exports.getRatingofChef = async (id) => {

  try {
      const rating = await AggregateReview.findOne({
        where:{
          review_type:reviewConstants.REVIEW_TYPE_CHEF, 
          chefID:id
        }
        
      });
      return rating;
    } catch (e) {
      console.log(e)
      throw e;
    }
};

exports.getRatingofDriver = async (id) => {

  try {
      const rating = await AggregateReview.findOne({
        where:{
          review_type:reviewConstants.REVIEW_TYPE_DRIVER, 
          driverID:id
        }
        
      });
      return rating;
    } catch (e) {
      console.log(e)
      throw e;
    }
};



