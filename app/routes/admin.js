'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/admin-controler');
const authService = require("../services/auth");

router.post("/autenticate", controller.authenticate);
router.get("/list-docs", authService.authorizeAdmin, controller.listAllDocs);
router.post("/edit-docs", authService.authorizeAdmin, controller.checkDocs);
router.get('/chef-licenses/getmodeltype', controller.getModelTypeChefLicenses);
router.get('/chef-certificates/getmodeltype', controller.getModelTypeChefCertificates);
router.get('/kitchen-images/getmodeltype', controller.getModelTypeKitchenImages);
router.get('/kitchen-photos/getmodeltype', controller.getModelTypeKitchenPhotos);
router.get('/profile-photos/getmodeltype', controller.getModelTypeProfilePhotos);
router.get('/nid-frontsides/getmodeltype', controller.getModelTypeNIDFrontSides);

module.exports = router;
