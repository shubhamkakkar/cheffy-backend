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

exports.list = asyncHandler(async(req, res, next) => {
    const response = await repository.getUserReservation(req.userId)
    res.status(HttpStatus.ACCEPTED).send({ data: response });
});

exports.create = asyncHandler(async(req, res, next) => {
    let newData = req.body;
    await repository.createReservation(newData)
    res.status(HttpStatus.ACCEPTED).send({ message: "Successfully created New Reservation!" });
});

exports.modify = asyncHandler(async(req, res, next) => {
    const orderId = req.params.orderId;
    if (!orderId) {
        return res.status(HttpStatus.BAD_REQUEST).send({message: "orderId is required for modifying a reservation"})
    }
    const reservation = await repository.getReservationByOrderId(orderId);
    if (Math.abs(new Date() - new Date(reservation.deliveryTime)) <= 86400000) {
        return res.status(HttpStatus.FORBIDDEN).send({message: "Unable to modify reservation before 24 hours of delivery time"});
    }
    await repository.modifyReservation(orderId, req.body)
    res.status(HttpStatus.ACCEPTED).send({ message: "Reservation Updated!" });
});

exports.cancel = asyncHandler(async(req, res, next) => {
    const orderId = req.params.orderId;
    if (!orderId) {
        return res.status(HttpStatus.BAD_REQUEST).send({message: "orderId is required for cancelling a reservation"})
    }
    const reservation = await repository.getReservationByOrderId(orderId);
    if (Math.abs(new Date() - new Date(reservation.deliveryTime)) <= 86400000) {
        return res.status(HttpStatus.FORBIDDEN).send({message: "Unable to cancel reservation before 24 hours of delivery time"});
    }
    await repository.cancelReservation(orderId);;
    res.status(HttpStatus.ACCEPTED).send({ message: "Reservation Cancelled!" });
});
