'use strict';

const express = require('express');

const authService = require("../services/auth");
const controller = require('../controlers/favourite-controler');
const path = require('path');
const userController = require(path.resolve('app/controlers/user-controler'));


const router = express.Router();

router.post('/add', authService.authorize, userController.getAuthUserMiddleware, controller.favourite);
router.delete('/remove/:fav_type/:id', authService.authorize, userController.getAuthUserMiddleware, controller.removeFavourite);
router.get('/', authService.authorize, controller.list);
    
module.exports = router;
