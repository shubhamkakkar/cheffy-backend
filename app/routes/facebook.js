'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/facebook-controller');

router.post('/create',controller.sendFacebookAuthCode);
router.post('/auth',controller.auth);

module.exports = router;
