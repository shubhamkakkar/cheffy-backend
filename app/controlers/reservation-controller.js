"use strict";
const path = require('path');
const HttpStatus = require("http-status-codes");
const repository = require("../repository/reservation-repository");
const authService = require("../services/auth");
const asyncHandler = require('express-async-handler');

const { User, Reservation } = require('../models/index');

const events = require(path.resolve('app/services/events'));
const appConstants = require(path.resolve('app/constants/app'));
const paginator = require(path.resolve('app/services/paginator'));
const ValidationContract = require('../services/validator');

exports.list = asyncHandler(async(req, res, next) => {

    const response = await repository.getUserReservation(req.userId)
    res
        .status(HttpStatus.OK)
        .send({ data: response });
  });

  exports.create = asyncHandler(async(req, res, next) => {

    try{

    const contract = new ValidationContract();

    contract.isRequired(req.body.foodName, 'foodName is required!');
    contract.isRequired(req.body.description, 'description is required!');
    contract.isRequired(req.body.photo, 'photo is required!');
    contract.isRequired(req.body.chefRange, 'chefRange is required!');
    contract.isRequired(req.body.quantity, 'quantity is required!');
    contract.isRequired(req.body.allDay, 'allDay is required!');
    contract.isRequired(req.body.deliveryTime, 'deliveryTime is required!');

    if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

    let newData = {};

    newData.foodName = req.body.foodName;
    newData.description = req.body.description;
    newData.photo = req.body.photo;
    newData.chefRange = req.body.chefRange;
    newData.quantity = req.body.quantity;
    newData.allDay = req.body.allDay;
    newData.deliveryTime = req.body.deliveryTime;
    newData.userId = req.userId;
    await repository.createReservation(newData)
    res
        .status(HttpStatus.OK)
        .send({ message: "Successfully created New Reservation!" });

    }
    catch(e){
        console.log(e)
    }
}); 