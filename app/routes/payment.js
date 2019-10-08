'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/payment-controler');

router.get('/success', controller.success);
router.get('/cancel', controller.cancel);

module.exports = router;
