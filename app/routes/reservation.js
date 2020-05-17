"use strict";

const path = require('path');
const express = require("express");
const router = express.Router();
const controller = require("../controlers/reservation-controller");
const authService = require("../services/auth");

router.post("/", authService.authorize, controller.create);
router.get("/", authService.authorize, controller.list);
router.put("/:id", authService.authorize, controller.update);

module.exports = router;