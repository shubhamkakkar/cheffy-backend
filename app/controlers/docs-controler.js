"use strict";
var HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/docs-repository");
const md5 = require("md5");
const authService = require("../services/auth");
const uploadService = require('../services/upload');
const { User } = require("../models/index");

exports.create = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actualUser = await User.findByPk(token_return.id);
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
    saved_data = await repository.getUserDoc(token_return.id);
  if (actualUser.user_type === 'chef')
    saved_data = await repository.getDriverDoc(token_return.id);

  res.status(HttpStatus.OK).send({ message: "Documents successfully saved", result: saved_data });
}


exports.list = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  let user_docs;
  
  if (req.query.state) {
    user_docs = await repository.getUserDocs(req.query.state, token_return.id);
  } else {
    user_docs = await repository.getUserDocs(token_return.id);
  }

  if (user_docs) {
    res.status(HttpStatus.ACCEPTED).send(user_docs);
    return 0;
  }
  res.status(HttpStatus.ACCEPTED).send({
    message: "No documents found!",
    error: false
  });
};

exports.edit = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token']);
    const actual = await User.findByPk(token_return.id);
    let existDocs;
    if (actual.user_type === 'chef')
      existDocs = await repository.getChefDoc(req.params.id);
    if (actual.user_type === 'driver')
      existDocs = await repository.getDriverDoc(req.params.id);

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
      updatedDocs = await repository.getUserDoc(token_return.id);

    res.status(200).send({ message: 'Docs successfully updated!', data: updatedDocs });
  } catch (e) {
    console.log("Error: ", e)
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};