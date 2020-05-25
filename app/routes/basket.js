'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/basket-controler');
const authService = require("../services/auth");
const userController = require(path.resolve('app/controlers/user-controler'));

router.post('/', authService.authorize, controller.addItem);
router.get('/', authService.authorize, userController.getAuthUserMiddleware, controller.list);

/**
* both plate and custom plate quantity can be changed. so instead of passing plateId in params,
* we pass basketItemId. this covers both custom plate and plate
*/
router.put('/subtract/:basketItemId', authService.authorize, controller.subtractItem);
router.delete('/delete/:basketItemId', authService.authorize, controller.deleteItem);
router.put('/add/:basketItemId', authService.authorize, controller.sumItem);

/*
router.get('/subtract/:id', authService.authorize, controller.subtractIten);
router.get('/add/:id', authService.authorize, controller.sumIten);
router.delete('/delete/:id', authService.authorize, controller.delItem);
*/

module.exports = router;
