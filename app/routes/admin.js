'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/admin-controler');
const authService = require("../services/auth");

router.post("/autenticate", controller.authenticate);
router.get("/list-docs", authService.authorizeAdmin, controller.listAllDocs);
router.post("/edit-docs", authService.authorizeAdmin, controller.checkDocs);

module.exports = router;
