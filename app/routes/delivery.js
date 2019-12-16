'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/delivery-controler');
const authService = require("../services/auth");
const userController = require(path.resolve('app/controlers/user-controler'));
const orderController = require(path.resolve('app/controlers/order-controler'));
const middlewares = require(path.resolve('server/middlewares'));

router.get('/', authService.authorize,controller.list);
router.get('/complete', authService.authorize,controller.listCompleteDeliveries);
router.get('/pending', authService.authorize,controller.listPendingDeliveries);
router.get('/:id',authService.authorize, controller.getById);
router.post('/edit/:id',authService.authorize, controller.edit);
router.post('/accept/:id',authService.authorize, controller.accept);
router.post('/decline/:id',authService.authorize, controller.decline);
router.post('/createdelivery/:orderId',authService.authorize, userController.getAuthUserMiddleware, middlewares.driverRoleRequired, controller.createDelivery);
router.post('/pickup/:id',authService.authorize, controller.pickupDelivery);
router.post('/complete/:id',authService.authorize, controller.completeDelivery);


router.param('orderId', orderController.orderByIdMiddleware);
router.param('id', orderController.orderDeliveryByIdMiddleware);

module.exports = router;
