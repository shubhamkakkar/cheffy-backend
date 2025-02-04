"use strict";

const path = require("path");
const HttpStatus = require("http-status-codes");
const repository = require("../repository/admin-repository");
const repositoryDocs = require("../repository/docs-repository");
const authService = require("../services/auth");
const asyncHandler = require("express-async-handler");
const userRepository = require("../repository/user-repository");
const paginator = require(path.resolve("app/services/paginator"));
const userConstants = require(path.resolve("app/constants/users"));
const orderPaymentRepository = require("../repository/orderPayment-repository");
const debug = require("debug")("admin");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
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
  } catch (error) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process",
      error: error,
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
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: error.message,
      error,
    });
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
    return res.status(HttpStatus.BAD_REQUEST).send(error.message);
  }
});

exports.acceptUserVerification = async (req, res, next) => {
  const { id } = req.params;

  const status = await userRepository.acceptUserVerification(id);

  try {
    if (status) {
      const status = await userRepository.acceptUserVerification(id);
      if (status) {
        return res.status(HttpStatus.OK).send(status);
      }
      return res.status(HttpStatus.NOT_FOUND).send(null);
    }
  } catch (error) {
    debug("error ", error.message);
    return res.status(HttpStatus.CONFLICT).send({
      message: "Fail to process",
      error,
    });
  }
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
  const acceptDriverVerification = await userRepository.acceptUserVerificationAndDocStatusTypeToApproved(
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

  const rejectDriverVerification = await userRepository.rejectUserVerificationAndDocStatusTypeToApproved(
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

  const acceptChefVerification = await userRepository.acceptUserVerificationAndDocStatusTypeToApproved(
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

  const rejectChefVerification = await userRepository.rejectUserVerificationAndDocStatusTypeToApproved(
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

exports.getDocsByUserType = asyncHandler(async (req, res, next) => {
  const { userType: user_type } = req.params;
  const { userId, name } = req.query;
  if (
    user_type === userConstants.USER_TYPE_DRIVER ||
    user_type === userConstants.USER_TYPE_CHEF
  ) {
    debug("user type: ", user_type);
    const pagination = paginator.paginateQuery(req);
    let query = { pagination, user_type };

    if (!isNaN(userId)) {
      query = {
        ...query,
        userId,
      };
    }

    if (query.userId && name) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: "Search can be done either by ID or NAME, not both",
        data: [],
      });
    }

    if (name) {
      const attributes = ["id"];
      const user = await userRepository.getUserByName(name, attributes);

      const idsArray = user.map(({ id }) => id);
      console.log({ idsArray });
      if (idsArray.length) {
        query = {
          ...query,
          userId: {
            [Op.in]: idsArray,
          },
        };
      } else {
        return res.status(HttpStatus.BAD_REQUEST).send({
          message: "No user found",
          data: [],
        });
      }
    }

    let userDoc = await repositoryDocs.getAllDriverChefDocsWithFilter(query);
    if (userDoc.length) {
      return res.status(HttpStatus.OK).send({
        message: "Docs are here",
        data: userDoc,
      });
    }

    return res.status(HttpStatus.OK).send({
      message: `Docs are not uploaded for this ${user_type}`,
      data: [],
    });
  }

  return res.status(HttpStatus.BAD_REQUEST).send({
    message: `userType can either be : ${userConstants.USER_TYPE_DRIVER} or ${userConstants.USER_TYPE_CHEF}`,
  });
});
