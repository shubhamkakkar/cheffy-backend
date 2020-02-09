'use strict';
const asyncHandler = require('express-async-handler');
const { Reservation } = require("../models/index");

exports.getUserReservation = asyncHandler(async (data) => {
    const response = await Reservation.findAll({where:{userId:data}});
    return response;
});

exports.getReservationByOrderId = asyncHandler(async (orderId) => {
    const response = await Reservation.findOne({where:{orderId:orderId}});
    return response;
});

exports.createReservation = asyncHandler(async (data) => {
    const response = await Reservation.create(data);
    return response;
});

exports.modifyReservation = asyncHandler(async (orderId, data) => {
    console.log("DATA: ", data, "Order ID: ", orderId)
    const [numberOfAffectedRows, affectedRows] = await Reservation.update(data, {where: {orderId: orderId}});
    return [numberOfAffectedRows, affectedRows];
});

exports.cancelReservation = asyncHandler(async (orderId) => {
    const response = await Reservation.destroy({where: {orderId: orderId}});
    return response;
});
