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
  '/',
  authService.authorize,
  multerStart(fieldsFile),
  controller.create
);

router.post('/chefLicense', authService.authorize, multerStart(fieldsFile), controller.createChefLicense);
router.post('/chefCertificate', authService.authorize, multerStart(fieldsFile), controller.createChefCertificate);
router.post('/kitchenPhoto', authService.authorize, multerStart(fieldsFile), controller.createKitchenPhoto);
router.post('/nidFrontSide', authService.authorize, multerStart(fieldsFile), controller.createNIDFrontInside);
router.post('/profilePhoto', authService.authorize, multerStart(fieldsFile), controller.createProfilePhoto);
router.post('/socialSecurityNumber', authService.authorize, multerStart(fieldsFile), controller.insertSocialSecurityNumber)
router.post('/driverLicense', authService.authorize, multerStart(fieldsFile), controller.createDriverLicense);
router.post('/vehicleRegistration', authService.authorize, multerStart(fieldsFile), controller.createDriverVehicleLicense);
router.get('/', authService.authorize, controller.list);
router.put(
  '/',
  authService.authorize,
  multerStart(fieldsFile),
  controller.edit);

module.exports = router;