"use strict";
const path = require("path");
const HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const {
  User,
  Wallet,
  OrderItem,
  /*ShippingAddress,*/
  Plates,
  Documents,
  PlateCategory,
} = require("../models/index");
/*const repositoryDoc = require('../repository/docs-repository');*/
const repository = require("../repository/plate-repository");
const repositoryCategory = require("../repository/category-repository");
/*const md5 = require('md5');*/
const authService = require("../services/auth");
const phoneService = require("../services/twillio");
const mailer = require("../services/mailer");
/*const kue = require('../services/kue');*/
const userRepository = require("../repository/user-repository");
/*const Request = require('request');
const Querystring = require('querystring');*/
require("../services/worker");
/*const crypto = require('crypto');*/
const walletRepository = require("../repository/wallet-repository");
const driverAPI = require("../services/driverApi");
const bcrypt = require("bcrypt");
const debug = require("debug")("user");
const asyncHandler = require("express-async-handler");
const userConstants = require(path.resolve("app/constants/users"));
const appConstants = require(path.resolve("app/constants/app"));
const userInputFilter = require(path.resolve("app/inputfilters/user"));
const events = require(path.resolve("app/services/events"));
const _ = require("lodash");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const paymentService = require("../services/payment");
const repositoryRating = require(path.resolve(
  "app/repository/rating-repository"
));

const { generateHash } = require("../../helpers/password");

const plates = require("../../resources/plates");

/**
 * SendMail helper
 */
async function sendMail({ req, pass }) {
  let args = {
    to: req.body.email,
    from: "Cheffy contact@cheffy.com",
    replyTo: "contact@cheffy.com",
    subject: `Welcome to Cheffy!`,
    template: "forget/forgot",
    context: { token: pass, user: " One more step..." },
  };

  try {
    return await mailer.sendMail(args);
  } catch (err) {
    console.log({ err });
    return 0;
  }
}

function userResponseHelper({ user }) {
  let userResponse = user.get({ plain: true });
  delete userResponse.password;
  delete userResponse.auth_token;
  return userResponse;
}

exports.userResponseHelper = require("./userController/helper/userResponseHelper");

/**
 * Middleware
 * Get currently authenticated user by userId decoded from jsonwebtoken.
 * see services/auth.js
 * Sets user in express req object
 */
exports.getAuthUserMiddleware = require("./userController/getAuthUserMiddleware");

/**
 * Middleware
 * Get currently authenticated user by userId decoded from jsonwebtoken, if token is valid and it contains the userId.
 * This should not send back NOT_FOUND response, it is used as optional middleware
 */
exports.getAuthUserIfPresentMiddleware = require("./userController/getAuthUserIfPresentMiddleware");

/**
 * Middleware
 * Get params user by userId from route. for e.g /order/list/:userId
 * Sets paramUser in express req object
 */
exports.getUserByUserIdParamMiddleware = require("./userController/getUserByUserIdParamMiddleware");

exports.dummy = require("./userController/dummy");

exports.create = require("./userController/create");

exports.getChefOrDriverBalance = require("./userController/getChefOrDriverBalance");

exports.getUserBalanceHistory = require("./userController/getUserBalanceHistory")
/*exports.getUserBalanceHistory = async (req, res, next) => {
// const token_return = await authService.decodeToken(req.headers['x-access-token'])
// const existUser = await User.findByPk(token_return.id, {
//   attributes: [ 'id', 'name', 'email', 'location', 'user_type', 'verification_email_status', 'verification_phone_status' ],
//   include: [
//     {
//       model: Wallet,
//       attributes: [ 'id', 'state_type' ],
//       include: [
//         {
//           model: OrderItem,
//           attributes: [ 'id', 'plate_id', 'name', 'amount', 'quantity', 'chef_payment' ],
//           where: { chef_payment: false }
//         }
//       ]
//     }
//   ]
// });
// if (!existUser) {
//   res.status(HttpStatus.CONFLICT).send({ message: 'Failed to access user info!', error: true });
//   return 0;
// }

// let datar = JSON.stringify(existUser);
// datar = JSON.parse(datar);
// let total = datar['Wallet']['OrderItems']
// total = total.reduce( function( prevVal, elem ) {
//   return parseFloat(prevVal) + parseFloat(elem.amount * elem.quantity);
// }, 0 );
// datar.Wallet.total = total;
// res.status(HttpStatus.OK).send(datar);
let historyMock = `{
  "id": 4,
  "name": "Demo user",
  "email": "user@example.com",
  "location": "38.912373, -77.198436",
  "user_type": "chef",
  "verification_email_status": "verified",
  "verification_phone_status": "verified",
  "Wallet": {
    "id": 1,
    "state_type": "open",
    "OrderItems": [
      {
        "id": 9,
        "plate_id": 8,
        "name": "X-Bacon 8",
        "amount": 10,
        "quantity": 2,
        "chef_payment": 0
      },
      {
        "id": 10,
        "plate_id": 8,
        "name": "X-Bacon 8",
        "amount": 10,
        "quantity": 2,
        "chef_payment": 0
      }
    ],
    "balance_history":[
      {
        "date":"2019-08-06",
        "balance":20.0
      },
      {
        "date":"2019-08-05",
        "balance":20.0
      },
      {
        "date":"2019-08-04",
        "balance":20.0
      }
    ],
    "total": 40
  }
}`;
res.status(HttpStatus.OK).send(JSON.parse(historyMock));
}*/
exports.getUser = require("./userController/getUser")
//Instead of getting the user data based on access token ,
//get the user details based on the userID passed as params
exports.getUserById = require("./userController/getUserById")
/**
 * Complete user registration
 */
exports.completeRegistration = require("./userController/completeRegistration")
/**
 * Verify email Token
 * This controller should be called when email token has been sent
 * and user sends email token with email in request
 */
exports.verifyEmailToken = require("./userController/verifyEmailToken")

exports.checkTokenExpiration = require("./userController/checkTokenExpiration")

/**
 * Resends email token if user doesn't receives token in email
 */
exports.resendEmailToken = require("./userController/resendEmailToken")

/**
 * Change password
 * user needs to send current password as well
 */
exports.changePassword = require("./userController/changePassword")

/**
 * Sets phone_no and country_code in user.
 * Sends sms token to phone for verification process
 */
exports.setUserPhone = require("./userController/setUserPhone")

/**
 * Sets zoom_id and zoom_pass in user.
 */
exports.setZoomCredentials = require("./userController/setZoomCredentials")

/**
 * Verify user phone. User sends sms_token in request
 */
exports.verifyUserPhone = require("./userController/verifyUserPhone")

/**
 * Edit user info
 */
exports.put = require("./userController/put");

/**
 * Edit user bio
 */
exports.editBio = require("./userController/editBio");
/**
 * DEPRECATED use shipping address API
 * Update user location_lat and location_lon fields
 * Sets default location/shipping_address of chef/user
 */
exports.updateLocation = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.location_lat, "Field location_lat is required");
  contract.isRequired(req.body.location_lon, "Field location_lon is required");

  if (!contract.isValid()) {
    return res
      .status(HttpStatus.NON_AUTHORITATIVE_INFORMATION)
      .send({
        message: contract.errors(),
        status: HttpStatus.NON_AUTHORITATIVE_INFORMATION,
      })
      .end();
  }

  const user = req.user;

  const updates = userInputFilter.locationFields.filter(req.body);

  await user.update(updates);

  res.status(HttpStatus.OK).send({
    message: "Location successfully updated!",
  });
});

exports.search = async (req, res, next) => {
  // const token_return = await authService.decodeToken(req.headers['x-access-token'])
  try {
    /*const existUser = await User.findOne({ where: { id: token_return.id } });
    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: 'user not found', status: HttpStatus.CONFLICT});
      return 0;
    }*/

    // let contract = new ValidationContract();

    try {
      let plates = await repository.getPlateSearch(req.params.text);
      let restaurants = await userRepository.getRestaurantSearch(
        req.params.text
      );
      let payload = {};
      payload.status = HttpStatus.OK;
      payload.plates = plates;
      payload.restaurants = restaurants;
      res.status(payload.status).send(payload);
    } catch (error) {
      res
        .status(HttpStatus.CONFLICT)
        .send({ message: "An error occurred", error: true })
        .end();
    }
  } catch (e) {
    res.status(500).send({
      message: "Failed to process your request",
    });
  }
};

exports.searchPredictions = async (req, res, next) => {
  try {
    try {
      let type_plate = await Plates.findAll({
        attributes: ["id", "name"],
      });

      let type_chef = await Plates.findAll({
        attributes: ["userId"],
        include: {
          model: User,
          as: "chef",

          attributes: ["restaurant_name"],
        },
      });
      let type_category = await PlateCategory.findAll({
        attributes: ["id", "name"],
      });

      let payload = {};
      payload.status = HttpStatus.OK;
      payload.type_plate = type_plate;
      payload.type_chef = type_chef;
      payload.type_category = type_category;
      res.status(payload.status).send(payload);
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatus.CONFLICT)
        .send({ message: "An error occurred", error: true })
        .end();
    }
  } catch (e) {
    res.status(500).send({
      message: "Failed to process your request",
    });
  }
};

/**
 * Method: POST
 * No AUTH
 * Forgot password
 * This is called when user forgets their password
 * It sends email_verification_token for password reset
 * Step 1 of forgot password
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  const { email } = req.body;
  contract.isEmail(email, "This email is incorrect");

  if (!contract.isValid()) {
    return res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({
      message: contract.errors(),
      status: HttpStatus.NON_AUTHORITATIVE_INFORMATION,
    });
  }

  const existUser = await User.findOne({ where: { email } });
  if (!existUser) {
    return res
      .status(HttpStatus.NOT_FOUND)
      .send({ message: "User not found!", status: HttpStatus.NOT_FOUND });
  }

  let template = "forget/forgot";

  let token = ("" + Math.random()).substring(2, 6);
  existUser.password_reset_token = token;
  await existUser.save();

  let args = {
    to: existUser.email,
    from: "Cheffy contact@cheffy.com",
    replyTo: "contact@cheffy.com",
    subject: `Email Token`,
    template,
    context: { token, user: existUser.name },
  };

  console.log({ token });

  mailer.sendMail(args, (error, info) => {
    if (error) {
      console.log({ mailerSendMail: error });
    } else {
      console.log("Message sent: %s", info.messageId);
    }
  });
  return res.status(HttpStatus.OK).send({
    message:
      "Congratulations, an email with verification code has been sent for reseting your password!",
    status: HttpStatus.OK,
  });
});

/**
 * Method: POST
 * No AUTH
 * Verify Email Token
 * Step 2 of forgot password
 */
exports.veryifyTokenforgotPassword = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, "This email is correct?");
  contract.isRequired(req.body.email_token, "This email token is required?");

  if (!contract.isValid()) {
    return res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (!existUser) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "Error validating data",
      status: HttpStatus.CONFLICT,
    });
  }

  if (existUser.password_reset_token === String(req.body.email_token)) {
    //existUser.verification_email_status = userConstants.STATUS_VERIFIED;
    // existUser.password_reset_token = '';
    // existUser.password = bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(10));
    // await existUser.save();

    return res.status(HttpStatus.OK).send({
      message: "Your email token has been verified!",
      status: HttpStatus.OK,
    });
  }

  return res.status(HttpStatus.CONFLICT).send({
    message: "Error validating token!",
    status: HttpStatus.CONFLICT,
  });
});

/**
 * Method: POST
 * No AUTH
 * Reset password
 * It is used after sending forgot password token to email
 * Step 2 of forgot password
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, "This email is correct?");
  contract.isRequired(req.body.email_token, "This email token is required");
  contract.isRequired(req.body.newPassword, "This newPassword is required");

  if (!contract.isValid()) {
    return res.status(HttpStatus.CONFLICT).send({
      message: contract.errors(),
    });
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (!existUser) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "Error validating data",
      status: HttpStatus.CONFLICT,
    });
  }

  if (existUser.password_reset_token === String(req.body.email_token)) {
    // existUser.verification_email_status = userConstants.STATUS_VERIFIED;
    existUser.password_reset_token = "";
    existUser.password = bcrypt.hashSync(
      req.body.newPassword,
      bcrypt.genSaltSync(10)
    );
    await existUser.save();

    return res.status(HttpStatus.OK).send({
      message: "Congratulations, password successfully reset!",
      status: HttpStatus.OK,
    });
  }

  res.status(HttpStatus.CONFLICT).send({
    message: "Error validating token!",
    status: HttpStatus.CONFLICT,
  });
});

// bank endpoints

/*
Method to get stripe account details for a user
*/

exports.stripeDetails = asyncHandler(async (req, res) => {
  try {
    if (!req.user.stripe_id) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send({ message: "User does not have a stripe account" });
    }
    const customer = await paymentService.getUser(req.user.stripe_id);
    return res.status(HttpStatus.OK).send(customer);
  } catch (e) {
    console.log(e);
  }
});

exports.getEphemeralKeys = asyncHandler(async (req, res, next) => {
  var api_version = req.body.api_version;
  var customerId = req.body.customerId;

  if (!api_version) {
    res.status(400).end();
    return;
  }
  try {
    const key = await paymentService.getEphemeralKey(customerId, api_version);
    return res.status(HttpStatus.OK).send(key);
  } catch (e) {
    console.log(e);
    res.send({
      message: "No such customer with stripe id: " + customerId,
    });
  }
});

//Method to create a bank account for a user

exports.createBankAccount = asyncHandler(async (req, res, next) => {
  try {
    const existUser = req.user;
    if (!existUser.stripe_id) {
      // https://github.com/SihyunC/bookish-octo-winner/commit/858c333f77439de7b6d375b3b586cada6b05fd81
      // alternative there, but jimmy n I talked over this process, not adding this.
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: "User must have a stripe account before adding a bank account",
      });
    }
    const bank_account = await paymentService.createBankAccount(
      existUser.stripe_id,
      req.body
    );
    res.status(HttpStatus.CREATED).send({
      message: "New Bank Account Created",
      data: bank_account,
    });
  } catch (err) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: err.message });
  }
});

//Method to update a bank account for a user
exports.updateBankAccount = asyncHandler(async (req, res, next) => {
  try {
    const existUser = req.user;
    if (!existUser.stripe_id) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message:
          "User must have a stripe account before updating a bank account",
      });
    }
    const bank_account = await paymentService.updateBankAccount(
      existUser.stripe_id,
      req.body.bankAccountId,
      req.body.account_holder_name
    );
    res.status(HttpStatus.CREATED).send({
      message: "Updated Bank Account",
      data: bank_account,
    });
  } catch (err) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: err.message });
  }
});

//Method to retrieve a bank account details for a user via bank account ID

exports.retrieveBankAccountById = asyncHandler(async (req, res, next) => {
  const existUser = req.user;
  if (!existUser.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: "User must have a stripe account before adding a bank account",
    });
  }
  const bank_account = await paymentService.retrieveBankAccountById(
    existUser.stripe_id,
    req.params.bankAccountId
  );
  res.status(HttpStatus.CREATED).send({
    message: "Here is your Bank Account",
    data: bank_account,
  });
});

//Method to retrieve all bank accounts for a user

exports.retrieveAllBankAccounts = asyncHandler(async (req, res, next) => {
  const limit = req.body.limit || 10;
  const existUser = req.user;
  if (!existUser.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: "User must have a stripe account before adding a bank account",
    });
  }
  const bank_accounts = await paymentService.retrieveAllBankAccounts(
    existUser.stripe_id,
    limit
  );
  res.status(HttpStatus.CREATED).send({
    message: "Here are your Bank Accounts",
    data: bank_accounts,
  });
});

//Method to delete a bank account for a user

exports.deleteBankAccount = asyncHandler(async (req, res, next) => {
  const existUser = req.user;
  if (!existUser.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: "User must have a stripe account before adding a bank account",
    });
  }
  const deleted = await paymentService.deleteBankAccount(
    existUser.stripe_id,
    req.params.bankAccountId
  );
  res.status(HttpStatus.CREATED).send({
    message: "Here are your Bank Accounts",
    data: deleted,
  });
});

//Method to verify a bank account for a user

exports.verifyBankAccount = asyncHandler(async (req, res, next) => {
  const existUser = req.user;
  if (!existUser.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: "User must have a stripe account before adding a bank account",
    });
  }
  const bank_account = await paymentService.verifyBankAccount(
    existUser.stripe_id,
    req.params.bankAccountId
  );
  res.status(HttpStatus.CREATED).send({
    message: "Bank Account Verified!",
    data: bank_account,
  });
});

exports.getPayments = asyncHandler(async (req, res, next) => {
  try {
    if (
      req.user.user_type !== userConstants.USER_TYPE_DRIVER &&
      req.user.user_type !== userConstants.USER_TYPE_CHEF
    ) {
      return res.status(HttpStatus.FORBIDDEN).send({
        message:
          "Only a Driver or Chef type user can get payments to their linked Bank Account",
      });
    }
    const wallet = await walletRepository.getWalletData(req.user.id);
    let total = wallet
      ? wallet[0].dataValues.balance + wallet[0].dataValues.tip
      : 0;
    if (total <= 0) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message:
          "Cannot transfer zero or negative wallet balance to your bank account",
      });
    }
    const payout = await paymentService.createPayout(
      total,
      req.body.bankAccount
    );
    wallet.balance = 0;
    wallet.tip = 0;
    await wallet.save();
    res.status(HttpStatus.OK).send({
      message:
        "Congratulations! Your wallet amount will be transferred to your bank account within 7 working days.",
      data: payout,
    });
  } catch (err) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: err.message });
  }
});

exports.addMoneyToWallet = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;

    if (user && user.user_type === userConstants.USER_TYPE_DRIVER) {
      const order_total = req.body.order_total;

      if (typeof order_total === "undefined" || order_total <= 0) {
        return res.status(HttpStatus.FORBIDDEN).send({
          message: "order_total is mandatory and has to be a non zero value",
        });
      }
      let wallet = await walletRepository.addDriversMoneyToWallet(
        user.id,
        order_total
      );
      res
        .status(HttpStatus.OK)
        .send({ message: "Wallet balance of driver updated" });
    } else if (user && user.user_type === userConstants.USER_TYPE_CHEF) {
      let wallet = await walletRepository.addChefsMoneyToWallet(user.id);
      res
        .status(HttpStatus.OK)
        .send({ message: "Wallet balance of the chef updated" });
    } else {
      return res.status(HttpStatus.FORBIDDEN).send({
        message:
          "Amount can be added to wallet only for users with user type Chef or Driver.",
      });
    }
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Failed to add money to wallet",
      data: e,
    });
    return 0;
  }
});

// addDevice enables user to add device
exports.addDevice = async (req, res) => {
  const { userId } = req;
  const { deviceName, deviceId, deviceToken } = req.body;
  const contract = new ValidationContract();
  contract.isRequired(deviceName, "Device name is required");
  contract.isRequired(deviceId, "Device ID is required!");
  contract.isRequired(deviceToken, "Device token is required!");
  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    return 0;
  }
  const data = {
    deviceName,
    deviceId,
    deviceToken,
    userId,
  };
  const device = await userRepository.addDevice(data);
  if (device)
    res.status(HttpStatus.OK).send({
      message: "Device added successfully",
    });
  else
    res.status(HttpStatus.SERVICE_UNAVAILABLE).send({
      message: "Unable to add device",
    });
};

/**
 * Soft delete a User account
 */
exports.deleteUserAccount = asyncHandler(async (req, res, next) => {
  try {
    let response = await userRepository.deleteUserAccount(req.params.userId);
    res.status(HttpStatus.OK).send({
      message: "User account deleted successfully",
      data: response,
    });
  } catch (e) {
    console.log(e);
    return res.status(HttpStatus.CONFLICT).send({
      message: "Failed to delete the user account",
      data: e,
      error: true,
    });
  }
});
exports.addTipsToWallet = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: userConstants.privateSelectFields,
    });
    const amount = req.body.amount;
    if (typeof amount === "undefined" || amount <= 0) {
      return res.status(HttpStatus.FORBIDDEN).send({
        message: "amount is mandatory and has to be a non zero value",
      });
    }
    if (!user) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .send({ message: "User not found", status: HttpStatus.NOT_FOUND });
    }
    if (
      user &&
      (user.user_type === userConstants.USER_TYPE_DRIVER ||
        user.user_type === userConstants.USER_TYPE_CHEF)
    ) {
      await walletRepository.addTipToWallet(user.id, amount);
      res
        .status(HttpStatus.OK)
        .send({ message: "Wallet updated with tip amount" });
    } else {
      return res.status(HttpStatus.FORBIDDEN).send({
        message:
          "Tips can be added to wallet only for users with user type Chef or Driver.",
      });
    }
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Failed to add tip to wallet",
      data: e,
    });
    return 0;
  }
});
