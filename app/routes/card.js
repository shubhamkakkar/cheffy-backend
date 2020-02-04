'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/card-controller');
const authService = require(path.resolve("app/services/auth"));
const userController = require(path.resolve('app/controlers/user-controler'));
const shippingController = require(path.resolve('app/controlers/shipping-controler'));

router.get('/', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.listUserCards);
router.post('/', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.addNewCard);
router.put('/', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.updateCustomer);
router.delete('/delete/:cardId', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.deleteCard);
router.post('/:cardId/setAsDefault', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.setAsDefaultCard);
router.get('/getCustomer', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.getCustomer);
/**
Admin routes
*/
router.get('/customers', authService.authorizeAdmin, userController.getAuthUserMiddleware,  controller.listCustomers);
router.delete('/:userId', authService.authorizeAdmin, controller.deleteCustomer);


router.param('userId', userController.getUserByUserIdParamMiddleware)

module.exports = router;
