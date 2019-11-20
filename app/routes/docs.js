"use strict";

const express = require("express");

const controller = require("../controlers/docs-controler");
const authService = require("../services/auth");
const multerStart = require("../../config/multer");

const router = express.Router();

const fieldsFile = [
  { name: 'driver_license', maxCount: 1 },
  { name: 'chef_certificate', maxCount: 1 },
  { name: 'kitchen_photo', maxCount: 1 },
  { name: 'profile_photo', maxCount: 1 },
  { name: 'front_side', maxCount: 1 },
  { name: 'chef_license', maxCount: 1 },
  { name: 'driver_license_front_side', maxCount: 1 },
  { name: 'driver_vehicle_registration', maxCount: 1 }
];

router.post(
  "/",
  authService.authorize,
  multerStart(fieldsFile),
  controller.create
);
router.get("/", authService.authorize, controller.list);
router.put(
  '/edit/:id',
  authService.authorize,
  multerStart(fieldsFile),
  controller.edit);

module.exports = router;