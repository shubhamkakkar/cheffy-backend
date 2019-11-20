'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/card-controller');

router.get('/',controller.listUserCards);
router.post('/',controller.addNewCard);

module.exports = router;
