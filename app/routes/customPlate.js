'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/customPlate-controler');
const authService = require("../services/auth");
const userController = require(path.resolve('app/controlers/user-controler'));
const shippingController = require("../controlers/shipping-controler");

router.post('/', authService.authorize, userController.getAuthUserMiddleware, controller.addCustomPlate);

/*get user custom plate with bids from chef*/
router.get('/', controller.customPlates);
router.get('/:customPlateId', controller.customPlate);


router.post('/pay', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.pay);
router.post('/bid', authService.authorize, userController.getAuthUserMiddleware, controller.bidCustomPlate);

//i think we need to add post since documents are created for this route, although no req.body is sent
router.post('/accept/bid/:auctionBidId', authService.authorize, userController.getAuthUserMiddleware, controller.acceptCustomPlateBid);


/*router.get('/list/all', authService.authorize, controller.listAllCustomPlates);
router.get('/list/:userId', authService.authorize, controller.listUserCustomPlates);*/

router.get('/order/list/:userId', authService.authorize, controller.listUserCustomOrders);


module.exports = router;
