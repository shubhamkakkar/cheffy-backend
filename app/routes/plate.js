'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/plate-controler');
const authService = require("../services/auth");


router.post('/', controller.create);
router.get('/', controller.list);
router.post('/edit/:id', controller.edit);
router.get("/search/:text", controller.searchPlates);
router.get('/show/:id', controller.getPlate);
router.get('/:id/review', controller.getPlateReview);
router.get('/:id/related', controller.getRelatedPlates);
//router.post('/:id/review', controller.createPlateReview);
router.get('/near', controller.listNear);
router.get('/custom-plates', controller.customPlates);
router.get('/custom-plate/:id', controller.customPlate);

router.get('/getmodeltype', controller.getModelTypePlates);
router.get('/categories/getmodeltype', controller.getModelTypePlateCategories);
router.get('/images/getmodeltype', controller.getModelTypePlateImages);
router.get('/reviews/getmodeltype', controller.getModelTypePlateReviews);
router.get('/custom-plates/getmodeltype', controller.getModelTypeCustomPlates);
router.get('/custom-auction-bids/getmodeltype', controller.getModelTypeCustomPlateAuctionBids);
router.get('/custom-auction/getmodeltype', controller.getModelTypeCustomPlateAuctions);
router.get('/custom-images/getmodeltype', controller.getModelTypeCustomPlateImages);
router.get('/custom-orders/getmodeltype', controller.getModelTypeCustomPlateOrders);
router.get('/ingredients/getmodeltype', controller.getModelTypeIngredients);
router.get('/receipt-images/getmodeltype', controller.getModelTypeReceiptImages);


module.exports = router;
