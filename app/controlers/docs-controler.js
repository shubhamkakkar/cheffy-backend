"use strict";
const path = require('path');
const HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/docs-repository");
const md5 = require("md5");
const authService = require("../services/auth");
const uploadService = require('../services/upload');
const {
  User, Documents, NIDFrontSide, ChefLicense, ChefCertificate,
  DriverVehicleRegistration, DriverLicenseFrontSide, KitchenPhoto,
ProfilePhoto } = require("../models/index");
const debug = require('debug')('docs');
const asyncHandler = require('express-async-handler');
const userConstants = require(path.resolve('app/constants/users'));
const documentConstants = require(path.resolve('app/constants/documents'));

exports.getAuthUserDocMiddleware = asyncHandler(async(req, res, next) => {
  //extract id, user_type from session
  const { id, user_type } = req.user;

  if (user_type === userConstants.USER_TYPE_DRIVER) {
    const doc = await repository.getDriverDoc(id);
    req.authUserDoc = doc;
  }

  if (user_type === userConstants.USER_TYPE_CHEF) {
    const doc = await repository.getDriverDoc(id);
    req.authUserDoc = doc;
  }

  if(!req.authUserDoc) {
    return res.status(HttpStatus.NOT_FOUND).send({message: 'Doc Not Found', status: HttpStatus.NOT_FOUND});
  }

  next();

});


exports.getDocByIdMiddleware = asyncHandler(async(req, res, next, docId) => {
  const doc = await repository.getDocById(docId);
  if(!doc) {
    return res.status(HttpStatus.NOT_FOUND).send({message: 'Doc Not Found', status: HttpStatus.NOT_FOUND});
  }
  req.doc = doc;
  next();

})

exports.create = asyncHandler(async (req, res, next) => {

  const actualUser = req.user;
  let actualDocs;

  if (actualUser.user_type === userConstants.USER_TYPE_DRIVER)
    actualDocs = await repository.getDriverDoc(actualUser.id);
  if (actualUser.user_type === userConstants.USER_TYPE_CHEF)
    actualDocs = await repository.getDriverDoc(actualUser.id);

  if (actualDocs) {
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", data: actualDocs });
    return 0;
  }

  let contract = new ValidationContract();
  if (actualUser.user_type === userConstants.USER_TYPE_CHEF) {

    /*Code updated on 8th May 2020 Removing valiation of SSN Numbers*/
    //contract.isRequired(req.body.social_security_number, 'The social security number is incorrect! field: social_security_number');
    contract.isRequired(req.files['chef_license'], "Chef's license is missing! field: chef_license ");
    contract.isRequired(req.files['chef_certificate'], "Chef's certificate is missing! field: chef_certificate");
    contract.isRequired(req.files['kitchen_photo'], "Kitchen photo is missing! field: kitchen_photo");
    contract.isRequired(req.files['front_side'], "Front side document is missing. field: front_side");
    contract.isRequired(req.files['profile_photo'], "User photo is missing. field: profile_photo");
  }

  if (actualUser.user_type === userConstants.USER_TYPE_DRIVER) {
    contract.isRequired(req.files['profile_photo'], "User photo is missing");
    /*Code updated on 8th May 2020 Removing valiation of SSN Numbers*/
    //contract.isRequired(req.body.social_security_number, 'The social security number is incorrect!');
    contract.isRequired(req.files['driver_license_front_side'], "Driver license is missing!");
    contract.isRequired(req.files['driver_vehicle_registration'], "Driver vehicle registration is missing!");
  }

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }

  let new_doc = await repository.createDoc({
    comment: "",
    userId: actualUser.id,
    social_security_number: req.body.social_security_number
  });

  if (actualUser.user_type === 'chef' && req.files['chef_license'])
    await repository.createChefLicense(new_doc.id, req.files.chef_license.shift());
  if (actualUser.user_type === 'chef' && req.files['chef_certificate'])
    await repository.createChefCertificate(new_doc.id, req.files.chef_certificate.shift());
  if (actualUser.user_type === 'chef' && req.files['kitchen_photo'])
    await repository.createKitchenPhoto(new_doc.id, req.files.kitchen_photo.shift());
  if (actualUser.user_type === 'chef' && req.files['front_side'])
    await repository.createNIDFrontSide(new_doc.id, req.files.front_side.shift());
  if (req.files['profile_photo']) {
    const photoResponse = await repository.createProfilePhoto(new_doc.id, req.files.profile_photo.shift());
    await actualUser.update({'imagePath': photoResponse.url});
  }

  if (actualUser.user_type === 'driver' && req.files['driver_license_front_side'])
    await repository.createDriverLicense(new_doc.id, req.files.driver_license_front_side.shift());
  if (actualUser.user_type === 'driver' && req.files['driver_vehicle_registration'])
    await repository.createDriverVehicleLicense(new_doc.id, req.files.driver_vehicle_registration.shift());

  let saved_data;

  if (actualUser.user_type === 'driver')
    saved_data = await repository.getUserDoc(actualUser.id);
  if (actualUser.user_type === 'chef')
    saved_data = await repository.getDriverDoc(actualUser.id);

  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", data: saved_data });
});

/**
* //TODO since a user only has one document, should we use list method
*/
exports.list = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  let user_docs;

  if (req.query.state) {
    user_docs = await repository.getUserDocs(req.query.state, userId);
  } else {
    user_docs = await repository.getUserDocs(userId);
  }

  if (!user_docs) {
    return res.status(HttpStatus.NOT_FOUND).send({
      message: "No documents found!",
      error: false
    });
  }

  return res.status(HttpStatus.OK).send(user_docs);

});

/**
* Get auth user document
*/
exports.getMyDoc = asyncHandler(async (req, res, next) => {
  const user = req.user;
  let userDoc = {};

  if (user.user_type === userConstants.USER_TYPE_CHEF) {
    userDoc = await repository.getUserDoc(user.id);
  }

  if (user.user_type === userConstants.USER_TYPE_DRIVER) {
    userDoc = await repository.getDriverDoc(user.id);
  }

  res.status(HttpStatus.OK).send({data: userDoc });
});

/**
* Get document by docId
*/
exports.getOne = asyncHandler(async (req, res, next) => {
  res.status(HttpStatus.OK).send({data: req.doc });
});

//TODO while editing docs. I thought the id we get was documentId.
//But infact what is used here is userId.
exports.edit = asyncHandler(async (req, res, next) => {
  
  const id = req.userId;
  const user = await User.findByPk(id);
  let existDocs;
 /*  if (user.user_type === userConstants.USER_TYPE_CHEF)
    existDocs = await repository.getUserDoc(id); */
  if (user.user_type === userConstants.USER_TYPE_DRIVER)
    existDocs = await repository.getDriverDoc(id);
  else
    existDocs = await repository.getUserDoc(id);

  if (!existDocs) {
    await Object.keys(req.files).map(async keyObject => {
      const { fieldname, key } = req.files[keyObject].shift();

      await uploadService.deleteImage(fieldname, key);
    });
    res.status(HttpStatus.CONFLICT).send({ message: "We couldn't find your docs", status: HttpStatus.CONFLICT});
    return 0;
  }

  if (existDocs.id && req.files['chef_license'])
    await repository.updateChefLicense(existDocs.id, req.files.chef_license.shift());
  if (existDocs.id && req.files['chef_certificate'])
    await repository.updateChefCertificate(existDocs.id, req.files.chef_certificate.shift());
  if (existDocs.id && req.files['kitchen_photo'])
    await repository.updateKitchenPhoto(existDocs.id, req.files.kitchen_photo.shift());
  if (existDocs.id && req.files['front_side'])
    await repository.updateNIDFrontSide(existDocs.id, req.files.front_side.shift());
  if (existDocs.id && req.files['profile_photo']) {
    const photoResponse = await repository.updateProfilePhoto(existDocs.id, req.files.profile_photo.shift());
    await user.update({'imagePath': photoResponse.url});
  }
  if (existDocs.id && req.files['driver_license_front_side'])
    await repository.updateDriverLicense(existDocs.id, req.files.driver_license_front_side.shift());
  if (existDocs.id && req.files['driver_vehicle_registration'])
    await repository.updateDriverVehicleRegistration(existDocs.id, req.files.driver_vehicle_registration.shift());

  //TODO this line sends userId to update Docs. but the function accepts documentId
  const document = await repository.userUpdateDoc(existDocs.id)
  if (existDocs.id && req.files['profile_photo']) {
    document.state_type = "validated"; //Profile photo doesn't require validation
    await document.save();
  }
  let updatedDocs;

  /* if (user.user_type === userConstants.USER_TYPE_CHEF)
    updatedDocs = await repository.getUserDoc(user.id); */
  if (user.user_type === userConstants.USER_TYPE_DRIVER)
    updatedDocs = await repository.getDriverDoc(user.id);
    else
    updatedDocs = await repository.getUserDoc(user.id);


  res.status(HttpStatus.OK).send({ message: 'Docs successfully updated!', data: updatedDocs });

});

/**
* Get Document status (state_type) of a user
*/
exports.getDocumentStatus = [
exports.getAuthUserDocMiddleware,
asyncHandler(async (req, res, next) => {
 res.status(HttpStatus.OK).send({doc_status: req.authUserDoc.state_type, id: req.authUserDoc.id});
})];


exports.createChefLicense = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.files['chef_license'], "Chef's license is missing!");

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  if (actualUser.user_type !== 'chef') {
    res.status(HttpStatus.UNAUTHORIZED).send({ message: 'You must be a chef to perform this action', status: HttpStatus.UNAUTHORIZED});
    return 0;
  }

  const actualDocs = await Documents.findOne({
      where: { userId: token_return.id },
      attributes: ['id', 'state_type', 'userId', 'social_security_number'],
      include: [{
        model: ChefLicense,
        attributes: ['id', 'description', 'url', 'state_type']
      }]
    });

  if (actualDocs && actualDocs.ChefLicense) {
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", result: actualDocs });
    return 0;
  }

  const new_doc = await repository.createDoc({
      comment: "",
      userId: token_return.id
    });

  if (req.files['chef_license'])
    await repository.createChefLicense(new_doc.id, req.files.chef_license.shift());

  let saved_data = await Documents.findOne({
    where: { userId: token_return.id },
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [{
      model: ChefLicense,
      attributes: ['id', 'description', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
});

exports.createChefCertificate = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.files['chef_certificate'], "Chef's license is missing!");//

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  if (actualUser.user_type !== 'chef') {
    res.status(HttpStatus.UNAUTHORIZED).send({ message: 'You must be a chef to perform this action', status: HttpStatus.UNAUTHORIZED});
    return 0;
  }

  const actualDocs = await Documents.findOne({//
      where: { userId: token_return.id },
      attributes: ['id', 'state_type', 'userId', 'social_security_number'],
      include: [{
        model: ChefCertificate,
        attributes: ['id', 'description', 'url', 'state_type']
      }]
    });

  if (actualDocs && actualDocs.ChefCertificate) {
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", result: actualDocs });
    return 0;
  }

  const new_doc = await repository.createDoc({
      comment: "",
      userId: token_return.id
    });

  if (req.files['chef_certificate'])
    await repository.createChefCertificate(new_doc.id, req.files.chef_certificate.shift());

  let saved_data = await Documents.findOne({
    where: { userId: token_return.id },
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [{
      model: ChefCertificate,
      attributes: ['id', 'description', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
});

exports.createKitchenPhoto = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.files['kitchen_photo'], "Chef's license is missing!");//

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  if (actualUser.user_type !== 'chef') {
    res.status(HttpStatus.UNAUTHORIZED).send({ message: 'You must be a chef to perform this action', status: HttpStatus.UNAUTHORIZED});
    return 0;
  }

  const actualDocs = await Documents.findOne({//
      where: { userId: token_return.id },
      attributes: ['id', 'state_type', 'userId', 'social_security_number'],
      include: [{
        model: KitchenPhoto,
        attributes: ['id', 'description', 'url', 'state_type']
      }]
    });

  if (actualDocs && actualDocs.KitchenPhoto) {//
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", result: actualDocs });
    return 0;
  }

  const new_doc = await repository.createDoc({
      comment: "",
      userId: token_return.id
    });

  if (req.files['kitchen_photo'])
    await repository.createKitchenPhoto(new_doc.id, req.files.kitchen_photo.shift());

  let saved_data = await Documents.findOne({
    where: { userId: token_return.id },
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [{
      model: KitchenPhoto,
      attributes: ['id', 'description', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
});

exports.createNIDFrontInside = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.files['front_side'], "Chef's license is missing!");//

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  const actualDocs = await Documents.findOne({//
      where: { userId: token_return.id },
      attributes: ['id', 'state_type', 'userId', 'social_security_number'],
      include: [{
        model: NIDFrontSide,
        attributes: ['id', 'description', 'url', 'state_type']
      }]
    });

  if (actualDocs && actualDocs.NIDFrontSide) {//
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", result: actualDocs });
    return 0;
  }

  const new_doc = await repository.createDoc({
      comment: "",
      userId: token_return.id
    });

  if (req.files['front_side'])//
    await repository.createNIDFrontSide(new_doc.id, req.files.front_side.shift());//

  let saved_data = await Documents.findOne({
    where: { userId: token_return.id },
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [{
      model: NIDFrontSide,
      attributes: ['id', 'description', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });

});

exports.createProfilePhoto = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.files['profile_photo'], "Profile photo missing! required field: profile_photo");//

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  const actualDocs = await Documents.findOne({//
      where: { userId: token_return.id },
      attributes: ['id', 'state_type', 'userId', 'social_security_number'],
      include: [{
        model: ProfilePhoto,
        attributes: ['id', 'description', 'url', 'state_type']
      }]
    });

  if (actualDocs && actualDocs.ProfilePhoto) {//
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", result: actualDocs });
    return 0;
  }

  const new_doc = await repository.createDoc({
      comment: "",
      userId: token_return.id
    });

  const profilePhoto = req.files.profile_photo.shift();
  if (req.files['profile_photo'])//
    await repository.createProfilePhoto(new_doc.id, profilePhoto);//

  let saved_data = await Documents.findOne({
    where: { userId: token_return.id },
    attributes: ["description", "url", "state_type"],
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [{
      model: ProfilePhoto,
      attributes: ['id', 'description', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  await saved_data.save();
  await actualUser.update({imagePath: profilePhoto.url});
  
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
});

exports.createDriverLicense = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.files['driver_license_front_side'], "Driver license is missing!");//

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  if (actualUser.user_type !== 'driver') {
    res.status(HttpStatus.UNAUTHORIZED).send({ message: 'You must be a driver to perform this action', status: HttpStatus.UNAUTHORIZED});
    return 0;
  }

  const actualDocs = await Documents.findOne({//
      where: { userId: token_return.id },
      attributes: ['id', 'state_type', 'userId', 'social_security_number'],
      include: [{
        model: DriverLicenseFrontSide,
        attributes: ['id', 'url', 'state_type']
      }]
    });

  if (actualDocs && actualDocs.DriverLicenseFrontSide) {//
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", result: actualDocs });
    return 0;
  }

  const new_doc = await repository.createDoc({
      comment: "",
      userId: token_return.id
    });

  if (req.files['driver_license_front_side'])//
    await repository.createDriverLicense(new_doc.id, req.files.driver_license_front_side.shift());//

  let saved_data = await Documents.findOne({
    where: { userId: token_return.id },
    attributes: ["description", "url", "state_type"],
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [{
      model: DriverLicenseFrontSide,
      attributes: ['id', 'state_type', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
});

exports.createDriverVehicleLicense = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.files['driver_vehicle_registration'], "Driver license is missing!");//

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  if (actualUser.user_type !== 'driver') {
    res.status(HttpStatus.UNAUTHORIZED).send({ message: 'You must be a driver to perform this action', status: HttpStatus.UNAUTHORIZED});
    return 0;
  }

  const actualDocs = await Documents.findOne({//
      where: { userId: token_return.id },
      attributes: ['id', 'state_type', 'userId', 'social_security_number'],
      include: [{
        model: DriverVehicleRegistration,
        attributes: ['id', 'state_type', 'url', 'state_type']
      }]
    });

  if (actualDocs && actualDocs.DriverVehicleRegistration) {//
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", result: actualDocs });
    return 0;
  }

  const new_doc = await repository.createDoc({
      comment: "",
      userId: token_return.id
    });

  if (req.files['driver_vehicle_registration'])//
    await repository.createDriverVehicleLicense(new_doc.id, req.files.driver_vehicle_registration.shift());//

  let saved_data = await Documents.findOne({
    where: { userId: token_return.id },
    attributes: ["description", "url", "state_type"],
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [{
      model: DriverVehicleRegistration,
      attributes: ['id', 'state_type', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
});

exports.insertSocialSecurityNumber = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.social_security_number, "Social security number is missing!");//

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findOne({ where: { id: token_return.id },
    include: {
      model: Documents,
      attributes: ['userId', 'state_type', 'social_security_number']
    } });

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  if (actualUser.Document && actualUser.Document.social_security_number) {//
    res.status(HttpStatus.OK).send({ message: "You already have social security number applied", result: actualUser.Document });
    return 0;
  }

  const new_doc = await Documents.create({
    comment: "",
    social_security_number: req.body.social_security_number,
    userId: token_return.id
  });

  new_doc.state_type = 'validated';
  new_doc.save()
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: new_doc });
});
