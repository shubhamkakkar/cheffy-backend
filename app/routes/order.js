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
const middlewares = require(path.resolve('server/middlewares'));

router.post('/', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.create);
router.get('/ready-delivery', authService.authorize, controller.ordersReadyForDelivery);
//list user order history
router.get('/list', authService.authorize, controller.list);
router.get('/list/tracking', authService.authorize, controller.listTracking);
router.get('/get/:orderId', authService.authorize, controller.getOneOrder);
//alias of above method
router.get('/:orderId', authService.authorize, controller.getOneOrder);

router.post('/:orderId/review', controller.createOrderReview);

router.put('/:orderId/state-type', authService.authorize, userController.getAuthUserMiddleware, orderPolicies.isAdminMiddleware(), controller.editOrderStateType);
router.param('orderId', controller.orderByIdMiddleware);
/**
* Order Items
*/

//this route allows status edit
router.put('/order-items/:orderItemId/state-type', authService.authorize,userController.getAuthUserMiddleware, orderItemPolicies.isOrderItemChefMiddleware(), controller.editOrderItemStateType);
router.get('/order-items/:orderItemId', authService.authorize, userController.getAuthUserMiddleware, orderItemPolicies.orderItemViewPolicyMiddleware(), controller.getOrderItem);
router.param('orderItemById', controller.orderItemByIdMiddleware);


router.param('orderItemId', controller.orderItemByIdMiddleware);
//chef related routes

router.get('/list/chef', authService.authorize, userController.getAuthUserMiddleware, middlewares.chefRoleRequired, controller.chefOrderList);

module.exports = router;
