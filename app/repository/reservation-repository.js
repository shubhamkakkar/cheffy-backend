'use strict';
const asyncHandler = require('express-async-handler');
const path = require('path');
const {Reservation, OrderFrequency, Basket, BasketItem, Plates, CustomPlate, CustomPlateOrder, User, ShippingAddress } = require('../models/index');
const userConstants = require(path.resolve('app/constants/users'));
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

exports.getUserReservation = asyncHandler(async (data) => {

    const response = await Reservation.findAll({where:{userId:data}});
    return response; 

});
exports.updateById = asyncHandler(async (data) => {

    const response = await Reservation.findOne({where:{id:data}});
    return response; 
});

exports.createReservation = asyncHandler(async (data) => {

    const response = await Reservation.create(data);
    return response; 

}); 
