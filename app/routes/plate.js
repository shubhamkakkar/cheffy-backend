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
    
module.exports = router;
