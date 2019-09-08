'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/driver-controler');
const authService = require("../services/auth");


router.put('/position', controller.updateDriverPosition);

module.exports = router;
