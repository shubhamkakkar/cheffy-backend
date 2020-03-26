'use strict';
const path = require('path');

const express = require('express');
const router = express.Router();
const controller = require('../controlers/customPlate-controler');
const authService = require("../services/auth");
const userController = require(path.resolve('app/controlers/user-controler'));
const shippingController = require("../controlers/shipping-controler");
const multerStart = require(path.resolve("config/multer"));
const customPlatePolicies = require(path.resolve('app/policies/custom-plate'));

const addFields = [
  'custom_plate_image',
];

const fieldsFile = addFields.map((field) => {
  return {name: field, maxCount: 5};
});

router.post('/', authService.authorize, userController.getAuthUserMiddleware, multerStart(fieldsFile), controller.addCustomPlate);
router.put('/:customPlateId', authService.authorize, userController.getAuthUserMiddleware, customPlatePolicies.isOwnerMiddleware(), multerStart(fieldsFile), controller.editCustomPlate);

/*get users custom plates with bids from chef*/
router.get('/', authService.authorizeOptional, userController.getAuthUserIfPresentMiddleware, controller.chefSearchCustomPlates);

router.get('/:customPlateId', controller.customPlate);


router.post('/:customPlateId/images', authService.authorize, userController.getAuthUserMiddleware, customPlatePolicies.isOwnerMiddleware(), multerStart(fieldsFile), controller.addImages);
router.delete('/:customPlateId/images/:customPlateImageId', authService.authorize, userController.getAuthUserMiddleware, customPlatePolicies.isOwnerMiddleware(), controller.deleteImage);

router.param('customPlateId', controller.customPlateByIdMiddleware);
router.param('customPlateImageId', controller.customPlateImageByIdMiddleware);


router.post('/pay', authService.authorize, userController.getAuthUserMiddleware, shippingController.getAuthUserShippingAddress, controller.pay);
router.post('/bid', authService.authorize, userController.getAuthUserMiddleware, controller.bidCustomPlate);

//i think we need to add post since documents are created for this route, although no req.body is sent
router.post('/accept/bid/:auctionBidId', authService.authorize, userController.getAuthUserMiddleware, controller.acceptCustomPlateBid);

router.get('/user/:userId', controller.listUserCustomPlates);
router.get('/user/my/list', authService.authorize, userController.getAuthUserMiddleware, controller.listMyCustomPlates);

router.param('userId', userController.getUserByUserIdParamMiddleware);

router.get('/order/list/:userId', authService.authorize, controller.listUserCustomOrders);


module.exports = router;
