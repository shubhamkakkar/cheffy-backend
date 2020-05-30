"use strict";

const path = require("path");
const express = require("express");
const router = express.Router();
const controller = require("../controlers/shipping-controler");
const authService = require("../services/auth");
const userController = require(path.resolve("app/controlers/user-controler"));
const shippingPolicies = require(path.resolve("app/policies/shipping-address"));

router.post(
  "/",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.create
);
router.get(
  "/",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.list
);

router.put(
  "/:shippingAddressId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  shippingPolicies.isOwnerMiddleware(),
  controller.edit
);
router.put(
  "/:shippingAddressId/set-default",
  authService.authorize,
  userController.getAuthUserMiddleware,
  shippingPolicies.isOwnerMiddleware(),
  controller.setDefaultAddress
);
router.delete(
  "/:shippingAddressId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  shippingPolicies.isOwnerMiddleware(),
  controller.remove
);

router.param("shippingAddressId", controller.getShippingAddressByIdMiddleware);

module.exports = router;
