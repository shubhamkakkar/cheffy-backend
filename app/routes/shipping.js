"use strict";

const express = require("express");
const router = express.Router();
const controller = require("../controlers/shipping-controler");
const authService = require("../services/auth");

router.post("/", authService.authorize, controller.create);
router.get("/", authService.authorize, controller.list);
router.post("/edit/:id", authService.authorize, controller.edit);

module.exports = router;
