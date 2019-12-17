'use strict';

const path = require('path');
const express = require('express');
const controller = require('../controlers/plate-controler');
const authService = require("../services/auth");
const multerStart = require("../../config/multer");
const shippingController = require(path.resolve('app/controlers/shipping-controler'));

const router = express.Router();

router.post('/', authService.authorize, shippingController.getAuthUserShippingAddress, controller.create);

router.get('/', controller.list);

router.post(
  '/images/:id',
  authService.authorize,
  multerStart([
    { name: 'plate_image', maxCount: 10 },
    { name: 'kitchen_image', maxCount: 10 },
    { name: 'receipt_image', maxCount: 10 }
  ]),
  controller.uploadImages
);

router.delete('/images/:type_image/:id', authService.authorize, controller.deleteImage);
router.post('/edit/:id', controller.edit);
router.delete('/:id', controller.delete);

router.get("/search/:text", controller.searchPlates);
router.get("/searchByChefId/:id", controller.searchPlatesByChefId);
router.get('/show/:id', controller.getPlate);
router.get('/:id/kitchen', controller.imagePlateKitchen);
router.get('/:id/review', controller.getPlateReview);
router.get('/:id/related', controller.getRelatedPlates);
//router.post('/:id/review', controller.createPlateReview);
//TODO should we keep custom plates api here. it would be confusing. since there is separate route file for custom plates
router.get('/near', controller.listNear);
router.get('/latest/:amount', controller.searchLatestPlates);

router.get('/chef/:id', authService.authorize, controller.getChefPlates);
router.get('/:id/receipt', authService.authorize, controller.listReceipt);

module.exports = router;
