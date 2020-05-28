"use strict";

const express = require("express");
const router = express.Router();
const controller = require("../controlers/admin-controler");
const authService = require("../services/auth");

router.post("/autenticate", controller.authenticate);
router.get("/list-docs", authService.authorizeAdmin, controller.listAllDocs);
router.post("/edit-docs", authService.authorizeAdmin, controller.checkDocs);

router.get(
  "/list/:user_type",
  authService.authorizeAdmin,
  controller.getAllUsers
);
router.get(
  "/list/:user_type/:id",
  authService.authorizeAdmin,
  controller.getSingleUser
);

router.post(
  "/:user_type/accept/:id",
  authService.authorizeAdmin,
  controller.acceptUserVerification
);

module.exports = router;
