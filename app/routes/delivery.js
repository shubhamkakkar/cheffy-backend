'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/delivery-controler');
const authService = require("../services/auth");

router.get('/', authService.authorize,controller.list);
router.get('/complete', authService.authorize,controller.listCompleteDeliveries);
router.get('/:id',authService.authorize, controller.getById);
router.post('/edit/:id',authService.authorize, controller.edit);
router.post('/accept/:id',authService.authorize, controller.accept);
router.post('/decline/:id',authService.authorize, controller.decline);
router.post('/createdelivery/:id',authService.authorize, controller.createDelivery);
router.post('/pickup/:id',authService.authorize, controller.pickupDelivery);
router.post('/complete/:id',authService.authorize, controller.completeDelivery);

module.exports = router;