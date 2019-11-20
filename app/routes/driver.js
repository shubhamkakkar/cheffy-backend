'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/driver-controler');
const authService = require("../services/auth");

router.put('/position', authService.authorize, controller.updateDriverPosition);
router.post('/get-position', authService.authorize, controller.getDriverPosition);
router.post('/bank-account', authService.authorize, controller.createBankAccount);

module.exports = router;
