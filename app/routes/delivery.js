'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/delivery-controler');
const authService = require("../services/auth");
const userController = require(path.resolve('app/controlers/user-controler'));
const orderController = require(path.resolve('app/controlers/order-controler'));
const orderDeliveryPolicies = require(path.resolve('app/policies/order-delivery'));
const middlewares = require(path.resolve('server/middlewares'));

router.post('/createdelivery/:orderId',authService.authorize, userController.getAuthUserMiddleware, middlewares.driverRoleRequired, controller.createDelivery);
router.get('/', authService.authorize,controller.list);
router.get('/complete', authService.authorize,controller.listCompleteDeliveries);
router.get('/user/pending', authService.authorize,controller.listPendingDeliveries);
router.get('/driver/pending', authService.authorize,controller.listPendingDeliveriesDriver);
router.post('/time', controller.calculateDeliveryTime);
router.get('/:orderDeliveryId',authService.authorize, controller.getById);

router.get('/price/calculate', controller.getDeliveryPrice);


//router.put('/edit/:id',authService.authorize, userController.getAuthUserMiddleware, orderDeliveryPolicies.isOwnerMiddleware, controller.edit);
router.put('/accept/:orderDeliveryId',authService.authorize, userController.getAuthUserMiddleware, orderDeliveryPolicies.isOrderDeliveryDriverMiddleware(), controller.accept);
router.put('/reject/:orderDeliveryId',authService.authorize, userController.getAuthUserMiddleware, orderDeliveryPolicies.isOrderDeliveryDriverMiddleware(), controller.reject);
router.put('/pickup/:orderDeliveryId',authService.authorize, userController.getAuthUserMiddleware, orderDeliveryPolicies.isOrderDeliveryDriverMiddleware(), controller.pickupDelivery);
router.put('/complete/:orderDeliveryId',authService.authorize, userController.getAuthUserMiddleware, orderDeliveryPolicies.isOrderDeliveryDriverMiddleware(), controller.completeDelivery);

router.param('orderId', orderController.orderByIdMiddleware);
router.param('orderDeliveryId', controller.orderDeliveryByIdMiddleware);

module.exports = router;
