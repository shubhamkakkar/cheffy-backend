"use strict";

const path = require("path");
const HttpStatus = require("http-status-codes");
const repository = require("../repository/admin-repository");
const repositoryDocs = require("../repository/docs-repository");
const authService = require("../services/auth");
const asyncHandler = require("express-async-handler");
const userRepository = require("../repository/user-repository");
const paginator = require(path.resolve("app/services/paginator"));

exports.authenticate = async (req, res, next) => {
  try {
    const customer = await repository.authenticateToken({
      token: req.body.token,
    });
    if (!customer) {
      res.status(HttpStatus.CONFLICT).send({
        message: "Invalid Token.",
      });
      return;
    }
    const token = await authService.generateToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      type: customer.user_type,
    });
    res.status(HttpStatus.OK).send({
      token: token,
      data: customer,
    });
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process",
    });
  }
};

exports.listAllDocs = async (req, res, next) => {
  try {
    const docs = await repository.listAllDocs();
    res.status(HttpStatus.OK).send(docs);
    return 0;
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process",
      error: e,
    });
    return 0;
  }
};

exports.checkDocs = async (req, res, next) => {
  try {
    const customer = await repository.authenticateToken({
      token: req.body.token,
    });
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process",
    });
  }

  try {
    await repositoryDocs.updateChefLicense(req.body.chef_license);
    if (!customer.skip_doc) {
      await repositoryDocs.updateChefCertificate(req.body.chef_certificate);
    }
    await repositoryDocs.updateKitchenPhoto(req.body.kitchen_photo);
    await repositoryDocs.updateNIDFrontSide(req.body.front_side);
    await repositoryDocs.updateProfilePhoto(req.body.profile_photo);
    await repositoryDocs.updateDoc(req.body.docs_base);

    res.status(HttpStatus.OK).send({
      message: "Successfully updated!",
    });
    return 0;
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process",
      error: e,
    });
    return 0;
  }
};

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { userType: user_type, id } = req.params;
  let query = { user_type };
  if (!isNaN(id)) {
    query = {
      ...query,
      id,
    };
  }
  const users = await userRepository.getAllDriver(query);
  return res.status(HttpStatus.OK).send(users);
});

exports.getSingleUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const users = await userRepository.getUserById(id);
    return res.status(HttpStatus.OK).send(users);
  } catch (error) {
    console.log(message);
    return res.status(HttpStatus.NOT_FOUND).send(null);
  }
});

exports.acceptUserVerification = async (req, res, next) => {
  const { id } = req.params;

  const status = await userRepository.acceptUserVerification(id);
  if (status) {
    return res.status(HttpStatus.OK).send(status);
  }
  return res.status(HttpStatus.ERROR).send("error valiating user");
};
