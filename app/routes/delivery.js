"use strict";

const path = require("path");
const express = require("express");
const router = express.Router();
const controller = require("../controlers/delivery-controler");
const authService = require("../services/auth");

const userController = require(path.resolve("app/controlers/user-controler"));
const orderController = require(path.resolve("app/controlers/order-controler"));

const driverController = require(path.resolve(
  "app/controlers/driver-controler"
));

const orderDeliveryPolicies = require(path.resolve(
  "app/policies/order-delivery"
));

const middlewares = require(path.resolve("server/middlewares"));

router.post(
  "/createdelivery/:orderId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  middlewares.driverRoleRequired,
  controller.createDelivery
);

router.get("/", authService.authorize, controller.list);

router.get(
  "/complete",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.listCompleteDeliveries
);

router.get(
  "/user/pending",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.listPendingDeliveries
);

router.get(
  "/user/approved",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.listApprovedDeliveries
);

router.get(
  "/driver/pending",
  authService.authorize,
  controller.listPendingDeliveriesDriver
);

router.post(
  "/time",
  authService.authorizeOptional,
  controller.calculateDeliveryTime
);

router.get(
  "/:orderDeliveryId",
  authService.authorize,
  controller.getDeliveryDetails
);

router.get(
  "/price/calculate",
  authService.authorizeOptional,
  controller.getDeliveryPrice
);

router.get("/chef/tracking/:orderItemId", controller.getOrderItemTrackingData);

//router.put('/edit/:id',authService.authorize, userController.getAuthUserMiddleware, orderDeliveryPolicies.isOwnerMiddleware, controller.edit);
router.put(
  "/accept/:orderDeliveryId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  orderDeliveryPolicies.isOrderDeliveryDriverMiddleware(),
  controller.accept
);

router.put(
  "/reject/:orderDeliveryId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  orderDeliveryPolicies.isOrderDeliveryDriverMiddleware(),
  controller.reject
);

router.put(
  "/pickup/:orderDeliveryId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  orderDeliveryPolicies.isOrderDeliveryDriverMiddleware(),
  controller.pickupDelivery
);

router.put(
  "/complete/:orderDeliveryId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  orderDeliveryPolicies.isOrderDeliveryDriverMiddleware(),
  controller.completeDelivery
);

router.put(
  "/bonus",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.isAdminMiddleware(),
  controller.addDriverBonusToWallet
);

router.put(
  "/bonus/:orderDeliveryId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.isAdminMiddleware(),
  controller.addDriverBonusToWallet
);

router.param("orderId", orderController.orderByIdMiddleware);
router.param("orderDeliveryId", controller.orderDeliveryByIdMiddleware);

router.get(
  "/driver/approved",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.listApprovedDeliveriesByDriver
);

router.get(
  "/driver/complete",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.listCompleteDeliveriesByDriver
);

router.post(
  "/driver/cancel/:orderId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  driverController.cancelOrder
);

router.post(
  "/chef/createdelivery/:orderItemId",
  authService.authorize,
  userController.getAuthUserMiddleware,
  middlewares.chefRoleRequired,
  controller.createChefOrderDelivery
);

router.get(
  "/time/:orderItemId/:mode",
  authService.authorize,
  userController.getAuthUserMiddleware,
  controller.deliveryTimeByItemId
);

module.exports = router;
