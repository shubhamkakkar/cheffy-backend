"use strict";

const repository = require("../repository/admin-repository");
const repositoryDocs = require("../repository/docs-repository");
const authService = require("../services/auth");
var HttpStatus = require('http-status-codes');

exports.authenticate = async (req, res, next) => {
  try {
    const customer = await repository.authenticateToken({
      token: req.body.token,
    });
    if (!customer) {
      res.status(HttpStatus.CONFLICT).send({
        message: "Invalid Token."
      });
      return;
    }
    const token = await authService.generateToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      type: customer.user_type
    });
    res.status(HttpStatus.ACCEPTED).send({
      token: token,
      data: customer
    });
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process"
    });
  }
};

exports.listAllDocs = async (req, res, next) => {
  try {
    const docs = await repository.listAllDocs();
    res.status(HttpStatus.ACCEPTED).send( docs );
    return 0;
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process",
      error: e
    });
    return 0;
  }
}

exports.checkDocs = async (req, res, next) => {
  try {
    await repositoryDocs.updateChefLicense(req.body.chef_license)
    await repositoryDocs.updateChefCertificate(req.body.chef_certificate)
    await repositoryDocs.updateKitchenPhoto(req.body.kitchen_photo)
    await repositoryDocs.updateNIDFrontSide(req.body.front_side)
    await repositoryDocs.updateProfilePhoto(req.body.profile_photo)
    await repositoryDocs.updateDoc(req.body.docs_base)

    res.status(HttpStatus.ACCEPTED).send({
      message: "Successfully updated!"
    });
    return 0;
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process",
      error: e
    });
    return 0;
  }
}
