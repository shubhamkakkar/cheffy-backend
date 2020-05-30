"use strict";

const express = require("express");

const authService = require("../services/auth");
const controller = require("../controlers/rating-controler");

const router = express.Router();

router.get("/:review_type/:id", authService.authorize, controller.getRating);

router.post("/", authService.authorize, controller.postRating);

module.exports = router;
