'use strict';

const path = require('path');
const express = require('express');
const controller = require('../controlers/plate-controler');
const authService = require("../services/auth");
const multerStart = require("../../config/multer");
const shippingController = require(path.resolve('app/controlers/shipping-controler'));
const userController = require(path.resolve('app/controlers/user-controler'));
const categoryController = require(path.resolve('app/controlers/category-controler'));
const platePolicies = require(path.resolve('app/policies/plate'));

const imageFields = [
  'profile_photo', 'kitchen_image', 'receipt_image'
];

const fieldsFile = imageFields.map((field) => {
  return {name: field, maxCount: 10};
});

const router = express.Router();

router.post('/', authService.authorize, shippingController.getAuthUserShippingAddress, controller.create);
router.get('/', authService.authorizeOptional, userController.getAuthUserIfPresentMiddleware, controller.list);
router.get('/help', authService.authorizeOptional, userController.getAuthUserIfPresentMiddleware, controller.searchHelp);

router.get('/show/:id', authService.authorizeOptional, userController.getAuthUserIfPresentMiddleware, controller.getPlate);
router.post('/edit/:id', authService.authorize, userController.getAuthUserMiddleware, platePolicies.isOwnerMiddleware(),  controller.edit);
router.delete('/:id', authService.authorize,userController.getAuthUserMiddleware, platePolicies.isOwnerMiddleware(), controller.delete);

router.post('/images/:id',authService.authorize,multerStart(fieldsFile),platePolicies.isOwnerMiddleware(), controller.uploadImages);

//TODO add permission
router.delete('/:id/images/:type_image/:plateImageId', authService.authorize, userController.getAuthUserMiddleware, platePolicies.isOwnerMiddleware(), controller.deleteImage);

router.get('/:id/kitchen', controller.imagePlateKitchen);
router.get('/:id/review', controller.getPlateReview);
router.get('/:id/related', controller.getRelatedPlates);
router.get('/:id/receipt', controller.listReceipt);

router.get('/category/:categoryId', controller.categoryPlates);
router.get('/chef/:chefId', authService.authorizeOptional, userController.getAuthUserIfPresentMiddleware, controller.getChefPlates);
router.get('/popular', controller.popularPlates);


router.param('categoryId', categoryController.categoryByIdMiddleware);
router.param('chefId', userController.getUserByUserIdParamMiddleware);
router.param('id', controller.getPlateByIdMiddleware);

module.exports = router;
