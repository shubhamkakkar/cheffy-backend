'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/basket-controler');
const authService = require("../services/auth");


router.post('/', authService.authorize, controller.addItem);
router.get('/', authService.authorize, controller.list);
router.get('/subtract/:id', authService.authorize, controller.subtractIten);
router.get('/add/:id', authService.authorize, controller.sumIten);
router.get('/getmodeltype', controller.getModelType);
router.get('/items/getmodeltype', controller.getModelTypeItems);

module.exports = router;
