"use strict";
const path = require("path");
const express = require("express");
const router = express.Router();
const controller = require("../controlers/category-controler");
const authService = require("../services/auth");
const userController = require(path.resolve("app/controlers/user-controler"));
const multerStart = require(path.resolve("config/multer"));
const categoryPolicies = require(path.resolve("app/policies/category"));

const udpateFields = ["category_image"];

const fieldsFile = udpateFields.map((field) => {
  return { name: field, maxCount: 1 };
});

router.post(
  "/",
  authService.authorize,
  //userController.getAuthUserMiddleware,
  multerStart(fieldsFile),
  controller.create
);

router.delete(
  "/:id",
  authService.authorize,
  userController.getAuthUserMiddleware,
  // categoryPolicies.isOwnerMiddleware(),
  controller.delete
);

router.put(
  "/edit/:categoryId",
  authService.authorize,
  //userController.getAuthUserMiddleware,
  //categoryPolicies.isOwnerMiddleware(),
  multerStart(fieldsFile),
  controller.edit
);

router.get("/", authService.authorizeOptional, controller.list);

router.get(
  "/:categoryId",
  authService.authorizeOptional,
  controller.getCategory
);

//TODO: need more info
router.param("categoryId", controller.categoryByIdMiddleware);

module.exports = router;
