'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/order-controler');
const authService = require("../services/auth");
const userController = require(path.resolve('app/controlers/user-controler'));
const shippingController = require("../controlers/shipping-controler");
const orderPolicies = require(path.resolve('app/policies/order'));
const orderItemPolicies = require(path.resolve('app/policies/order-item'));

router.post('/', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.create);
router.get('/ready-delivery', authService.authorize, controller.ordersReadyForDelivery);
router.get('/list', authService.authorize, controller.list);
router.get('/list/tracking', authService.authorize, controller.listTracking);
router.get('/get/:orderId', authService.authorize, controller.getOneOrder);
//alias of above method
router.get('/:orderId', authService.authorize, controller.getOneOrder);

router.post('/:orderId/review', controller.createOrderReview);

router.put('/:orderId/state-type', authService.authorize, userController.getAuthUserMiddleware, orderPolicies.isAdminMiddleware, controller.editOrderStateType);
router.param('orderId', controller.orderByIdMiddleware);
/**
* Order Items
*/

//this route allows status edit
router.put('/order-items/:orderItemId/status', authService.authorize,userController.getAuthUserMiddleware, orderItemPolicies.isOrderItemChefMiddleware, controller.editOrderItemStatus);
router.get('/order-items/:orderItemId', authService.authorize,userController.getAuthUserMiddleware, orderItemPolicies.isOrderItemChefMiddleware, controller.getOrderItem);
router.param('orderItemById', controller.orderItemByIdMiddleware);

module.exports = router;
