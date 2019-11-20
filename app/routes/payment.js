'use strict';

const express = require('express');
const router = express.Router();
const authService = require("../services/auth");
const controller = require('../controlers/payment-controler');

router.get('/paypal/callback', controller.callback);
router.get('/paypal/:orderId', authService.authorize, controller.startPaymentPaypal);
router.post('/paypal/confirm', controller.confirm);
router.get('/paypal/cancel', controller.cancel);

module.exports = router;
