"use strict";

const path = require('path');
const express = require("express");
const router = express.Router();
const controller = require("../controlers/reservation-controller");
const authService = require("../services/auth");

router.post("/", authService.authorize, controller.create);
router.get("/", authService.authorize, controller.list);
router.patch("/:orderId", authService.authorize, controller.modify);
router.delete("/:orderId", authService.authorize, controller.cancel);

module.exports = router;
