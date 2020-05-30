"use strict";

const express = require("express");
const router = express.Router();
const controller = require("../controlers/admin-controler");
const authService = require("../services/auth");

router.post("/autenticate", controller.authenticate);
router.get("/list-docs", authService.authorizeAdmin, controller.listAllDocs);
router.post("/edit-docs", authService.authorizeAdmin, controller.checkDocs);
router.post(
  "/driver/accept/:driverId",
  authService.authorizeAdmin,
  controller.acceptDriverRequest
);
router.post(
  "/driver/reject/:driverId",
  authService.authorizeAdmin,
  controller.rejectDriverRequest
);
router.post(
  "/chef/accept/:chefId",
  authService.authorizeAdmin,
  controller.acceptChefRequest
);
router.post(
  "/chef/reject/:chefId",
  authService.authorizeAdmin,
  controller.rejectChefRequest
);
router.get(
  "/list/:userType/:id?",
  authService.authorizeAdminForAdminListingOnly,
  controller.getAllUsers
);

router.get(
  "/orderPayments/:orderId?/:status?/:startDate?/:endDate?",
  authService.authorizeAdmin,
  controller.getAllOrderPayments
);

module.exports = router;
