'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/customPlate-controler');
const authService = require("../services/auth");


router.post('/', controller.addCustomPlate);
router.post('/pay', controller.payCustomPlate);
router.post('/bid', controller.bidCustomPlate);
router.get('/accept/bid/:id', controller.acceptCustomPlateBid);
router.get('/order/list/:userId', authService.authorize, controller.listCustomOrders)

module.exports = router;
