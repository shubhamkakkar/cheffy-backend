'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/category-controler');
const authService = require("../services/auth");


router.post('/edit/:id', controller.edit);
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id/plates', controller.listPlates);
router.get('/search/:text', controller.listPlates);

module.exports = router;
