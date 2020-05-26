"use strict";

const express = require("express");
const router = express.Router();
const controller = require("../controlers/admin-controler");
const authService = require("../services/auth");

router.post("/autenticate", controller.authenticate);
router.get("/list-docs", authService.authorizeAdmin, controller.listAllDocs);
router.post("/edit-docs", authService.authorizeAdmin, controller.checkDocs);
router.use(
  "/driver/accept/:driverId",
  authService.authorizeAdmin,
  controller.acceptDriverRequest
);
router.use(
  "/driver/reject/:driverId",
  authService.authorizeAdmin,
  controller.rejectDriverRequest
);
router.get(
  "/list/:userType",
  authService.authorizeAdminForAdminListingOnly,
  controller.getAllUsers
);

module.exports = router;
