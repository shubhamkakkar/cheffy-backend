"use strict";
var HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/docs-repository");
const md5 = require("md5");
const authService = require("../services/auth");
const uploadService = require('../services/upload');
const {
  User,
  Documents,
  ProfilePhoto,
  NIDFrontSide,
  KitchenPhoto,
  ChefLicense,
  ChefCertificate,
  DriverLicenseFrontSide,
  DriverVehicleRegistration } = require("../models/index");

exports.create = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  let actualDocs;
  if (actualUser.user_type === 'driver')
    actualDocs = await repository.getDriverDoc(token_return.id);
  if (actualUser.user_type === 'chef')
    actualDocs = await repository.getChefDoc(token_return.id);
  
  if (actualDocs) {
    res.status(HttpStatus.OK).send({ message: "You already have documents applied", result: actualDocs });
    return 0;
  }
  
  let contract = new ValidationContract();
  if (actualUser.user_type === 'chef') {
    contract.isRequired(req.body.social_security_number, 'The social security number is incorrect!');
    contract.isRequired(req.files['chef_license'], "Chef's license is missing!");
    contract.isRequired(req.files['chef_certificate'], "Chef's certificate is missing!");
    contract.isRequired(req.files['kitchen_photo'], "Kitchen photo is missing!");
    contract.isRequired(req.files['front_side'], "Front side document is missing");
    contract.isRequired(req.files['profile_photo'], "User photo is missing");
  }

  if (actualUser.user_type === 'driver') {
    contract.isRequired(req.files['profile_photo'], "User photo is missing");
    contract.isRequired(req.body.social_security_number, 'The social security number is incorrect!');
    contract.isRequired(req.files['driver_license_front_side'], "Driver license is missing!");
    contract.isRequired(req.files['driver_vehicle_registration'], "Driver vehicle registration is missing!");
  }

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  let new_doc = await repository.createDoc({
    comment: "",
    userId: token_return.id,
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
  if (req.files['profile_photo'])
    await repository.createProfilePhoto(new_doc.id, req.files.profile_photo.shift());
  if (actualUser.user_type === 'driver' && req.files['driver_license_front_side'])
    await repository.createDriverLicense(new_doc.id, req.files.driver_license_front_side.shift());
  if (actualUser.user_type === 'driver' && req.files['driver_vehicle_registration'])
    await repository.createDriverVehicleLicense(new_doc.id, req.files.driver_vehicle_registration.shift());

  let saved_data;

  if (actualUser.user_type === 'driver')
    saved_data = await repository.getDriverDoc(token_return.id);
  if (actualUser.user_type === 'chef')
    saved_data = await repository.getChefDoc(token_return.id);
  new_doc.state_type = 'validated';
  new_doc.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
}


exports.list = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findOne({ where: { id: token_return.id } });

  if (!actualUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  let actualDocs;
  if (actualUser.user_type === 'driver')
    actualDocs = await repository.getDriverDoc(token_return.id);
  if (actualUser.user_type === 'chef')
    actualDocs = await repository.getChefDoc(token_return.id);

  if (!actualDocs) {
    res.status(HttpStatus.NOT_FOUND).send({
      message: "No documents found!",
      status: HttpStatus.NOT_FOUND
    });
    return 0;
  }

  res.status(HttpStatus.ACCEPTED).send({ message: "Documents found successfully", result: actualDocs });  
};

exports.edit = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token']);
    const actual = await User.findByPk(token_return.id);

    if (!actual) {
      res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND});
      return 0;
    }

    let existDocs;
    if (actual.user_type === 'chef')
      existDocs = await repository.getChefDoc(actual.id);
    if (actual.user_type === 'driver')
      existDocs = await repository.getDriverDoc(actual.id);

    if (!existDocs) {
      await Object.keys(req.files).map(async keyObject => {
        const { fieldname, key } = req.files[keyObject].shift();
  
        await uploadService.deleteImage(fieldname, key);
      });

      res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: "We couldn't find your docs", status: HttpStatus.NON_AUTHORITATIVE_INFORMATION });
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
    if (existDocs.id && req.files['profile_photo'])
      await repository.updateProfilePhoto(existDocs.id, req.files.profile_photo.shift());
    if (existDocs.id && req.files['driver_license_front_side'])
      await repository.updateDriverLicense(existDocs.id, req.files.driver_license_front_side.shift());
    if (existDocs.id && req.files['driver_vehicle_registration'])
      await repository.updateDriverVehicleRegistration(existDocs.id, req.files.driver_vehicle_registration.shift());

    await repository.userUpdateDoc(req.params.id)

    let updatedDocs;

    if (actual.user_type === 'driver')
      updatedDocs = await repository.getDriverDoc(token_return.id);
    if (actual.user_type === 'chef')
      updatedDocs = await repository.getChefDoc(token_return.id);

    res.status(200).send({ message: 'Docs successfully updated!', result: updatedDocs });
  } catch (e) {
    console.log("Error: ", e)
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};

exports.createChefLicense = async (req, res, next) => {
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
}

exports.createChefCertificate = async (req, res, next) => {
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
}

exports.createKitchenPhoto = async (req, res, next) => {
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
}

exports.createNIDFrontInside = async (req, res, next) => {
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
}

exports.createProfilePhoto = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.files['profile_photo'], "Chef's license is missing!");//

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

  if (req.files['profile_photo'])//
    await repository.createProfilePhoto(new_doc.id, req.files.profile_photo.shift());//

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
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
}

exports.createDriverLicense = async (req, res, next) => {
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
        attributes: ['id', 'description', 'url', 'state_type']
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
      attributes: ['id', 'description', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
}

exports.createDriverVehicleLicense = async (req, res, next) => {
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
        attributes: ['id', 'description', 'url', 'state_type']
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
    await repository.createDriverVehicleLicense(new_doc.id, req.files.driver_license_front_side.shift());//

  let saved_data = await Documents.findOne({
    where: { userId: token_return.id },
    attributes: ["description", "url", "state_type"],
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [{
      model: DriverVehicleRegistration,
      attributes: ['id', 'description', 'url', 'state_type']
    }]
  });
  saved_data.state_type = 'validated';
  saved_data.save();
  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
}

exports.insertSocialSecurityNumber = async (req, res, next) => {
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
}