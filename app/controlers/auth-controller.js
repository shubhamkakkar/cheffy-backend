"use strict";
const path = require("path");
const jwt = require("jsonwebtoken");
const appleSignin = require("apple-signin");
const NodeRSA = require("node-rsa");
const request = require("request-promise-native");
const HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const {
  User,
  Wallet,
  OrderItem,
  ShippingAddress,
  Plates,
  Documents,
  PlateCategory,
} = require("../models/index");
const repositoryDoc = require("../repository/docs-repository");
const repository = require("../repository/plate-repository");
const repositoryCategory = require("../repository/category-repository");
const md5 = require("md5");
const authService = require("../services/auth");
const phoneService = require("../services/twillio");
const mailer = require("../services/mailer");
const kue = require("../services/kue");
const userRepository = require("../repository/user-repository");
const Request = require("request");
const Querystring = require("querystring");
require("../services/worker");
const crypto = require("crypto");
const walletRepository = require("../repository/wallet-repository");
const driverAPI = require("../services/driverApi");
const bcrypt = require("bcrypt");
const debug = require("debug")("user");
const asyncHandler = require("express-async-handler");
const userConstants = require(path.resolve("app/constants/users"));
const appConstants = require(path.resolve("app/constants/app"));
const userInputFilter = require(path.resolve("app/inputfilters/user"));
const events = require(path.resolve("app/services/events"));
const { userResponseHelper } = require("./user-controler");
const _ = require("lodash");

const { generateHash } = require("../../helpers/password");

const getApplePublicKey = async (kid) => {
  const ENDPOINT_URL = "https://appleid.apple.com";
  const url = new URL(ENDPOINT_URL);
  url.pathname = "/auth/keys";

  const data = await request({ url: url.toString(), method: "GET" });
  let key;

  for (let a of JSON.parse(data).keys) {
    if (a.kid == kid) {
      key = a;
      break;
    }
  }

  const pubKey = new NodeRSA();
  pubKey.importKey(
    { n: Buffer.from(key.n, "base64"), e: Buffer.from(key.e, "base64") },
    "components-public"
  );
  return pubKey.exportKey(["public"]);
};

exports.socialauth = asyncHandler(async (req, res, next) => {
  const contract = new ValidationContract();

  let { email, device_id } = req.body;
  contract.isRequired(req.body.provider, "provider is Required");

  if (req.body.provider != "apple") {
    contract.isRequired(req.body.provider_user_id, "provider id is Required");
    contract.isRequired(req.body.email, "email is Required");
  } else {
    contract.isRequired(req.body.jwt, "jwt is Required");
  }

  if (!contract.isValid()) {
    return res.status(HttpStatus.CONFLICT).send({
      message: contract.errors().length
        ? contract.errors()
        : "Review user info",
    });
  }

  if (req.body.provider == "apple") {
    //get kid

    let decodedToken = jwt.decode(req.body.jwt, {
      complete: true,
    });

    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      res.status(HttpStatus.CONFLICT).send({
        message: "KID missing from token",
        status: HttpStatus.CONFLICT,
      });
      return 0;
    }

    const applePublicKey = await getApplePublicKey(decodedToken.header.kid);

    jwt.verify(
      req.body.jwt,
      applePublicKey,
      { ignoreExpiration: true },
      function (error, decoded) {
        debug("accessToken", error);
        debug("verifyAccessToken", decoded);
        //if (jwtClaims.exp < (Date.now() / 1000)) throw new Error('id token has expired');

        if (error) {
          return res.status(HttpStatus.CONFLICT).send({
            message: "Invalid token",
            error: error,
            payload: decoded,
          });
        }

        email = decoded.email;
      }
    );
  }

  if (!email) {
    return false;
  }

  try {
    const existUser = await User.findOne({
      where: { email: email },
      attributes: userConstants.privateSelectFields,
      include: [
        {
          model: ShippingAddress,
          attributes: [
            "addressLine1",
            "addressLine2",
            "city",
            "state",
            "zipCode",
            "lat",
            "lon",
          ],
          as: "address",
        },
      ],
    });

    if (!existUser) {
      res
        .status(HttpStatus.CONFLICT)
        .send({ message: "user not found", status: HttpStatus.CONFLICT });
      return 0;
    }

    existUser.provider = req.body.provider;
    existUser.provider_user_id = req.body.provider_user_id;

    const token = await authService.generateToken({
      id: existUser.id,
      email: existUser.email,
      name: existUser.name,
    });

    existUser.auth_token = token;
    existUser.verification_email_status = "verified";
    device_id ? (existUser.device_id = device_id) : null;
    await existUser.save();

    const userResponse = userResponseHelper({ user: existUser });

    return res.status(200).send({
      token: token,
      data: userResponse,
    });
  } catch (er) {
    console.log({
      er,
    });
  }
});

exports.socialauthRegister = asyncHandler(async (req, res, next) => {
  const contract = new ValidationContract();

  let { email, device_id } = req.body;

  contract.isRequired(req.body.user_type, "user_type is Required");
  contract.isRequired(req.body.provider, "provider is Required");
  //contract.isRequired(req.body.provider_user_id, 'provider id is Required');
  contract.isRequired(req.body.name, "name is Required");

  //contract.isRequired(req.body.email, 'email is Required');
  //contract.isRequired(req.body.imagePath, 'imagePath id is Required');

  if (req.body.user_type === userConstants.USER_TYPE_CHEF)
    contract.isRequired(
      req.body.restaurant_name,
      "Restaurant name is required!"
    );

  if (!contract.isValid()) {
    return res
      .status(HttpStatus.CONFLICT)
      .send({ message: "Review user info" });
  }

  if (req.body.provider == "apple") {
    //get kid

    let decodedToken = jwt.decode(req.body.jwt, {
      complete: true,
    });

    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      res.status(HttpStatus.CONFLICT).send({
        message: "KID missing from token",
        status: HttpStatus.CONFLICT,
      });
      return 0;
    }

    const applePublicKey = await getApplePublicKey(decodedToken.header.kid);

    jwt.verify(
      req.body.jwt,
      applePublicKey,
      { ignoreExpiration: true },
      function (error, decoded) {
        debug("accessToken", error);
        debug("verifyAccessToken", decoded);
        //if (jwtClaims.exp < (Date.now() / 1000)) throw new Error('id token has expired');
        console.info(decoded);
        if (error || !decoded.email) {
          res.status(HttpStatus.CONFLICT).send({
            message: "Invalid token",
            error: error,
            payload: decoded,
          });
          return 0;
        }

        email = decoded.email;
      }
    );
  }

  if (!email) {
    return false;
  }

  const existUser = await User.findOne({ where: { email: email } });

  if (existUser) {
    res
      .status(HttpStatus.CONFLICT)
      .send({ message: "user already exists", status: HttpStatus.CONFLICT });
    return 0;
  }

  let user = {};

  user.name = req.body.name;
  user.email = email;
  user.user_type = req.body.user_type;
  user.provider = req.body.provider;
  user.imagePath = req.body.imagePath;
  user.provider_user_id = req.body.provider_user_id;

  /*if (user.user_type === userConstants.USER_TYPE_DRIVER) {
    await driverAPI.createDriver({
      name: user.name,
      email: user.email
    });
  }*/

  if (user.user_type === userConstants.USER_TYPE_CHEF) {
    user.restaurant_name = req.body.restaurant_name;
  }

  let full_data = user;

  const createdUser = await User.create({ ...full_data });

  const token = await authService.generateToken({
    id: createdUser.id,
    email: createdUser.email,
    name: createdUser.name,
  });
  device_id ? (createdUser.device_id = device_id) : null;
  createdUser.auth_token = token;

  await createdUser.save();

  const existUserNew = await User.findOne({
    where: { email: email },
    attributes: userConstants.privateSelectFields,
    include: [
      {
        model: ShippingAddress,
        attributes: [
          "addressLine1",
          "addressLine2",
          "city",
          "state",
          "zipCode",
          "lat",
          "lon",
        ],
        as: "address",
      },
    ],
  });

  return res.status(200).send({
    message:
      "Congratulations, successfully created user type " +
      user.user_type +
      " !",
    status: HttpStatus.CREATED,
    result: existUserNew,
  });
});

exports.authenticate = asyncHandler(async (req, res, next) => {
  const { password, device_id, login } = req.body;
  debug("body", req.body);

  function emptyFieldError(missingField) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: `${missingField} field is empty`,
    });
  }

  if (!login) {
    return emptyFieldError("login");
  }

  if (!password) {
    return emptyFieldError("password");
  }
  let customer;
  var reg = new RegExp(/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/);
  let whereClause = {};

  if (reg.test(login)) {
    whereClause = { email: login };
  } else {
    const num_list = login.split(" ");
    whereClause = { country_code: num_list[0], phone_no: num_list[1] };
  }

  try {
    customer = await User.findOne({
      where: whereClause,
      include: [
        {
          model: ShippingAddress,
          attributes: [
            "addressLine1",
            "addressLine2",
            "city",
            "state",
            "zipCode",
            "lat",
            "lon",
          ],
          as: "address",
        },
      ],
    });

    if (!customer) {
      res.status(HttpStatus.FORBIDDEN).send({
        message: "User does not exist in our records",
        data: null,
      });
      return 0;
    }

    if (customer.verification_email_status !== userConstants.STATUS_VERIFIED) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send({ message: "Email Not verified. Complete registration first" });
    }

    debug("customer", customer);
    let result = await bcrypt.compare(password, customer.password);

    if (!result) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .send({ message: "Wrong password", data: null });
    }

    const doc = await Documents.findOne({ where: { userId: customer.id } });
    const token = await authService.generateToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      type: customer.user_type,
    });

    customer.auth_token = token;
    device_id ? (customer.device_id = device_id) : null;
    await customer.save();

    const userResponse = userResponseHelper({ user: customer });

    res.status(200).send({
      token: token,
      data: { userResponse, user_doc: !!doc },
    });

    //publish create action
    events.publish(
      {
        action: "login",
        user: customer.get({}),
        query: req.query,
        //login can be by any user so scope is all
        scope: appConstants.SCOPE_ALL,
        type: "user",
      },
      req
    );
  } catch (error) {
    return res.send(500).send({
      message: "server is bussy. please try after some time",
      data: null,
    });
  }
});

exports.logout = asyncHandler(async (req, res, next) => {
  const existUser = await User.findOne({ where: { id: req.userId } });

  if (!existUser) {
    return res.status(HttpStatus.NOT_FOUND).send({
      message: "error when updating: user not found",
      status: HttpStatus.NOT_FOUND,
    });
  }

  existUser.auth_token = null;

  existUser.save();

  res.status(200).send({
    message: "successfully logged out!",
  });
});
