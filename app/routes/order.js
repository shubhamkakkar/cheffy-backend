'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/order-controler');
const authService = require("../services/auth");

router.post('/', authService.authorize, controller.create);
router.get('/ready-delivery', authService.authorize, controller.ordersReadyForDelivery);
router.get('/list', authService.authorize, controller.list);
router.get('/list/tracking', authService.authorize, controller.listTracking);
router.get('/get/:id', authService.authorize, controller.getOneOrder);
router.post('/:id/review', controller.createOrderReview);

module.exports = router;
