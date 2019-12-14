'use strict';

const express = require('express');

const authService = require("../services/auth");
const controller = require('../controlers/favourite-controler');


const router = express.Router();

router.post('/add', authService.authorize, controller.favourite);
router.delete('/remove', authService.authorize, controller.removeFavourite);
router.get('/', authService.authorize, controller.list);
    
module.exports = router;
