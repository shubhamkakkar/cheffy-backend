"use strict";

const path = require("path");
const HttpStatus = require("http-status-codes");
const repository = require("../repository/admin-repository");
const repositoryDocs = require("../repository/docs-repository");
const authService = require("../services/auth");
const asyncHandler = require("express-async-handler");
const userRepository = require("../repository/user-repository");
const paginator = require(path.resolve("app/services/paginator"));
const orderPaymentRepository = require("../repository/orderPayment-repository");
const debug = require("debug")("admin");

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
  debug("user type: ", user_type);
  const pagination = paginator.paginateQuery(req);
  let query = { pagination, user_type };

  if (!isNaN(id)) {
    query = {
      ...query,
      id,
    };
  }

  try {
    const users = await userRepository.getAllDriver(query);
    return res.status(HttpStatus.OK).send(users);
  } catch (error) {
    debug("error ", error);
    return res.status(HttpStatus.ERROR).send(error.message);
  }
});

exports.getSingleUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await userRepository.getUserById(id);
    if (user) {
      return res.status(HttpStatus.OK).send(users);
    }
    return res.status(HttpStatus.NOT_FOUND).send(null);
  } catch (error) {
    debug(message);
    return res.status(HttpStatus.ERROR).send(error.message);
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

exports.acceptDriverRequest = async (req, res, next) => {
  const {
    params: { driverId },
  } = req;

  const driver = await userRepository.getUserById(driverId);

  if (driver.adminVerficaton) {
    return res.status(HttpStatus.CONFLICT).send({
      data: {
        requestApproved: false,
        message: "Driver's documents are already autherized",
      },
    });
  }
  const acceptDriverVerification = await userRepository.acceptUserVerification(
    driverId
  );

  if (acceptDriverVerification) {
    return res.status(HttpStatus.OK).send({
      data: {
        //true
        requestApproved: acceptDriverVerification,
      },
    });
  }

  return res.status(HttpStatus.NOT_MODIFIED).send({
    data: {
      //false
      requestApproved: acceptDriverVerification,
    },
  });
};

exports.rejectDriverRequest = async (req, res, next) => {
  const {
    params: { driverId },
  } = req;

  const driver = await userRepository.getUserById(driverId);
  if (!driver.adminVerficaton) {
    return res.status(HttpStatus.CONFLICT).send({
      data: {
        requestRejected: false,
        message: "Driver's documents are already not verified",
      },
    });
  }

  const rejectDriverVerification = await userRepository.rejectUserVerification(
    driverId
  );

  if (rejectDriverVerification) {
    return res.status(HttpStatus.OK).send({
      data: {
        //true
        requestRejected: rejectDriverVerification,
      },
    });
  }

  return res.status(HttpStatus.NOT_MODIFIED).send({
    data: {
      //false
      requestRejected: rejectDriverVerification,
    },
  });
};

exports.acceptChefRequest = async (req, res, next) => {
  const {
    params: { chefId },
  } = req;

  const chef = await userRepository.getUserById(chefId);

  if (chef.adminVerficaton) {
    return res.status(HttpStatus.CONFLICT).send({
      data: {
        requestRejected: false,
        message: "chef's documents are already autherized",
      },
    });
  }

  const acceptChefVerification = await userRepository.acceptUserVerification(
    chefId
  );

  if (acceptChefVerification) {
    return res.status(HttpStatus.OK).send({
      data: {
        //true
        requestApproved: acceptChefVerification,
      },
    });
  }

  return res.status(HttpStatus.NOT_MODIFIED).send({
    data: {
      //false
      requestApproved: acceptChefVerification,
    },
  });
};

exports.rejectChefRequest = async (req, res, next) => {
  const {
    params: { chefId },
  } = req;

  const chef = await userRepository.getUserById(chefId);
  if (!chef.adminVerficaton) {
    return res.status(HttpStatus.CONFLICT).send({
      data: {
        requestRejected: false,
        message: "chef's documents are already not verified",
      },
    });
  }

  const rejectChefVerification = await userRepository.rejectUserVerification(
    chefId
  );

  if (rejectChefVerification) {
    return res.status(HttpStatus.OK).send({
      data: {
        //true
        requestRejected: rejectChefVerification,
      },
    });
  }

  return res.status(HttpStatus.NOT_MODIFIED).send({
    data: {
      //false
      requestRejected: rejectChefVerification,
    },
  });
};

exports.getAllOrderPayments = async (req, res, next) => {
  const pagination = paginator.paginateQuery(req);

  function customErOverDateRange(missingField) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message:
        "For getting data over date range, both endDate and startDate are required",
      missingField,
    });
  }

  if (req.query.startDate && !req.query.endDate) {
    return customErOverDateRange("endDate");
  }

  if (!req.query.startDate && req.query.endDate) {
    return customErOverDateRange("startDate");
  }

  if (
    req.query.startDate &&
    req.query.endDate &&
    req.query.startDate > req.query.endDate
  ) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: "starDate can't be greater than endDate",
    });
  }

  const query = { pagination, ...req.query };

  const orderPayments = await orderPaymentRepository.getOrderPayments(query);
  return res.status(HttpStatus.OK).send(orderPayments);
};
