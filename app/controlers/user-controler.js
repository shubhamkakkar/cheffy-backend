'use strict'
const path = require('path');
const HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const { User, Wallet, OrderItem, ShippingAddress, Plates, Documents,PlateCategory } = require('../models/index');
const repositoryDoc = require('../repository/docs-repository');
const repository = require('../repository/plate-repository');
const repositoryCategory = require('../repository/category-repository');
const md5 = require('md5');
const authService = require('../services/auth');
const phoneService = require('../services/twillio');
const mailer = require('../services/mailer');
const kue = require("../services/kue");
const userRepository = require("../repository/user-repository");
const Request  = require('request');
const Querystring  = require('querystring');
require("../services/worker");
const crypto = require('crypto');
const walletRepository = require('../repository/wallet-repository');
const driverAPI = require('../services/driverApi');
const bcrypt = require('bcrypt');
const debug = require('debug')('user');
const asyncHandler = require('express-async-handler');
const userConstants = require(path.resolve('app/constants/users'));
const appConstants = require(path.resolve('app/constants/app'));
const userInputFilter = require(path.resolve('app/inputfilters/user'));
const events = require(path.resolve('app/services/events'));
const _ = require('lodash');

const { generateHash } = require('../../helpers/password');

const plates = require('../../resources/plates');

/**
* SendMail helper
*/
async function sendMail({req, pass}) {
  let args = {
    to: req.body.email,
    from: "Cheffy contact@cheffy.com",
    replyTo: "contact@cheffy.com",
    subject: `Welcome to Cheffy!`,
    template: "forget/forgot",
    context: { token: pass, user: ' One more step...' }
  };

  return await mailer.sendMail(args);
}

function userResponseHelper({user}) {
  let userResponse = user.get({plain: true});
  delete userResponse.password;
  delete userResponse.auth_token;
  return userResponse;
}

/**
* Middleware
* Get currently authenticated user by userId decoded from jsonwebtoken.
* see services/auth.js
* Sets user in express req object
*/
exports.getAuthUserMiddleware = asyncHandler(async(req, res, next) => {

  const user = await User.findByPk(req.userId , {
    attributes: userConstants.privateSelectFields,
    //raw: true
  });

  if(!user) {
    return res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND });
  }

  req.user = user;
  next();

});

/**
* Middleware
* Get currently authenticated user by userId decoded from jsonwebtoken, if token is valid and it contains the userId.
* This should not send back NOT_FOUND response, it is used as optional middleware
*/
exports.getAuthUserIfPresentMiddleware = asyncHandler(async(req, res, next) => {
  if(!req.userId) return next();

  const user = await User.findByPk(req.userId , {
    attributes: userConstants.privateSelectFields,
  });

  if(!user) {
    return next();
  }

  req.user = user;
  next();

});

/**
* Middleware
* Get params user by userId from route. for e.g /order/list/:userId
* Sets paramUser in express req object
*/
exports.getUserByUserIdParamMiddleware = asyncHandler(async(req, res, next, userId) => {
  if(!userId) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Not userId params set in request', status: HttpStatus.BAD_REQUEST });
  }

  const user = await User.findByPk(userId , {
    attributes: userConstants.privateSelectFields
  });

  if(!user) {
    return res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found', status: HttpStatus.NOT_FOUND });
  }

  req.paramUser = user;
  next();

});

exports.dummy = async (req, res, next) => {
  const category = await repositoryCategory.createCategory({ name: 'Dummy', description: 'Dummy category', url: '#' });
  let ingred, images, kitchen, receipt, full_data;
  for (let i = 0; i < plates.length; i++) {
    full_data = plates[i];
    full_data.userId = 1;

    if (full_data.ingredients) {
      ingred = full_data.ingredients;
      delete full_data.ingredients;
    }

    if (full_data.images) {
      images = full_data.images;
      delete full_data.images;
    }

    if (full_data.kitchen_images) {
      kitchen = full_data.kitchen_images;
      delete full_data.kitchen_images;
    }

    if (full_data.receipt_images) {
      receipt = full_data.receipt_images;
      delete full_data.receipt_images;
    }

    full_data.categoryId = category.id;

    let plate = await Plates.create({ ...full_data });
    let ingred_create, images_create, kitchen_create, receipt_create

    if (ingred) {
      let ingred_data = []
      ingred.forEach(elem => {
        elem.plateId = plate.id;
        ingred_data.push(elem);
      })
      ingred_create = await repository.createIngredient(ingred_data)
    }

    if (images) {
      let images_data = []
      images.forEach(elem => {
        elem.plateId = plate.id;
        images_data.push(elem);
      })
      images_create = await repository.createPlateImage(images_data)
    }

    if (kitchen) {
      let kitchen_data = []
      kitchen.forEach(elem => {
        elem.plateId = plate.id;
        kitchen_data.push(elem);
      })
      kitchen_create = await repository.createKitchenImage(kitchen_data)
    }

    if (receipt) {
      let receipt_data = []
      receipt.forEach(elem => {
        elem.plateId = plate.id;
        receipt_data.push(elem);
      })
      receipt_create = await repository.createReceiptImage(receipt_data)
    }
  }

  res.status(HttpStatus.ACCEPTED).send({ message: 'Plates are being created', status: HttpStatus.ACCEPTED });
}

exports.create = asyncHandler(async (req, res, next) => {
  let payload = {};

  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'Invalid email');

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (existUser && existUser.verification_email_status === 'pending') {
    const doc = await Documents.findOne({ where: { userId: existUser.id } });
    let pass = (""+Math.random()).substring(2,6);
    existUser.verification_email_token = pass;
    await existUser.save();

    await sendMail({req, pass});

    const { id, email, verification_email_status, password } = existUser;

    res.status(HttpStatus.OK).send({
      message: "Resend token for you email!",
      status: HttpStatus.OK,
      result: { id, email, verification_email_status, password_generated: !!(password), user_doc: !!(doc) }
    });

    //publish create action
    return events.publish({
        action: 'token-resend',
        user: existUser.get({}),
        query: req.query,
        //registration can be by any user so scope is all
        scope: appConstants.SCOPE_ALL,
        type: 'user'
    }, req);

  }

  if (existUser && existUser.id) {
    const doc = await Documents.findOne({ where: { userId: existUser.id } });
    res.status(HttpStatus.ACCEPTED).send({
      message: "Already registered user",
      result: {
        user_type: existUser.user_type,
        verification_email_status: existUser.verification_email_status,
        password_generated: !!(existUser.password),
        user_doc: !!(doc)
      },
      status: HttpStatus.ACCEPTED });
    return 0;
  }

  let full_data = req.body;
  const user = await User.create({ ...full_data });
  let pass = (""+Math.random()).substring(2,6);
  user.verification_email_token = pass;
  await user.save();

  await sendMail({req, pass});

  const token = await authService.generateToken({
    id: user.id,
    email: user.email
  });

  const newuser = await User.findOne({
    where: { id: user.id },
    attributes: ['id', 'name', 'email', 'country_code', 'phone_no', 'user_type', 'verification_email_status', 'verification_phone_status', 'createdAt'],
  });
  payload.token = token;
  payload.result = newuser;

  payload.status = HttpStatus.CREATED;
  res.status(payload.status).send(payload);

  //publish create action
  events.publish({
      action: 'create',
      user: newuser.get({}),
      query: req.query,
      //registration can be by any user so scope is all
      scope: appConstants.SCOPE_ALL,
      type: 'user'
  }, req);

});

exports.getUserBalance = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findByPk(token_return.id, {
    attributes: [ 'id', 'name', 'email', 'location', 'user_type', 'verification_email_status', 'verification_phone_status' ],
    include: [
      {
        model: Wallet,
        attributes: [ 'id', 'state_type' ],
        include: [
          {
            model: OrderItem,
            attributes: [ 'id', 'plate_id', 'name', 'amount', 'quantity', 'chef_payment' ],
            where: { chef_payment: false }
          }
        ]
      }
    ]
  });
  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Failed to access user info!', error: true });
    return 0;
  }

  let datar = JSON.stringify(existUser);
  datar = JSON.parse(datar);
  let total = 0;

  if(datar.Wallet !== null || datar.Wallet.OrderItems !== null && datar.Wallet.OrderItems.lenght > 0){

    total = total.reduce( function( prevVal, elem ) {
      return parseFloat(prevVal) + parseFloat(elem.amount * elem.quantity);
    }, 0 );

  }
  datar.Wallet.total = total;
  res.status(HttpStatus.ACCEPTED).send(datar);
}

exports.getUserBalanceHistory = async (req, res, next) => {
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
  // res.status(HttpStatus.ACCEPTED).send(datar);
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
  res.status(HttpStatus.ACCEPTED).send(JSON.parse(historyMock));
}

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const shippingAddresses = await user.getAddress();
  const userResponse = userResponseHelper({user});
  userResponse.address = shippingAddresses;
  res.status(HttpStatus.ACCEPTED).send({ message: 'SUCCESS', data: userResponse});

});

exports.verifyPhone = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.country_code, 'Country Code is Required!');
  contract.isRequired(req.body.phone_no, 'Phone Number is Required!');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token'])

  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (!existUser) {
    res.status(HttpStatus.OK).send({ message: "E-Mail already in use!", status: HttpStatus.OK });
    return 0;
  }

  const code = (""+Math.random()).substring(2,6);
  existUser.verification_phone_token = code;
  existUser.country_code = req.body.country_code;
  existUser.phone_no = req.body.phone_no;
  await existUser.save();

  let phone = req.body.country_code + req.body.phone_no;

  if (phone === null && phone === '' && phone === undefined) {
    res.status(HttpStatus.OK).send({ message: 'error when registering: phone not found', status: HttpStatus.OK });
    return 0;
  }

  const retorno = await phoneService.sendMessage(phone, code);

  res.status(HttpStatus.OK).send(retorno);
});



exports.completeRegistration = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'This email is correct?');
  contract.isRequired(req.body.name, 'User password is required!');
  contract.isRequired(req.body.password, 'User password is required!');
  contract.isRequired(req.body.user_type, 'User type is required!');

  if (req.body.user_type === userConstants.USER_TYPE_CHEF) contract.isRequired(req.body.restaurant_name, 'Restaurant name is required!');

  if (!contract.isValid()) {
    return res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });


  if (!existUser) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: `E-Mail not found, email: ${req.body.email}`, status: HttpStatus.BAD_REQUEST });
  }
  debug('existing user', existUser.get({plain: true}));

  debug('email status: ', existUser.verification_email_status);
  if (existUser.verification_email_status !== userConstants.STATUS_VERIFIED) {
    return res.status(HttpStatus.UNAUTHORIZED).send({ message: 'Token code not verified!', status: HttpStatus.UNAUTHORIZED});
  }

  existUser.name = req.body.name;
  existUser.user_type = req.body.user_type;
  existUser.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
  existUser.promotionalContent = req.body.promotionalContent;

  if (existUser.user_type === userConstants.USER_TYPE_DRIVER) {
    await driverAPI.createDriver({
      name: existUser.name,
      email: existUser.email
    });
  }

  if (existUser.user_type === userConstants.USER_TYPE_CHEF) {
    existUser.restaurant_name = req.body.restaurant_name;
  }

  await existUser.save();

  const userResponse = userResponseHelper({user: existUser});

  res.status(HttpStatus.CREATED).send({
    message: `Congratulations, successfully created ${req.body.user_type} type user!`,
    status: HttpStatus.CREATED,
    result: userResponse
  });
});

exports.verifyEmailToken = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'Email is correct?')
  contract.isRequired(req.body.email_token, 'This email token is required!');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (req.body.email_token === existUser.verification_email_token) {
    //existUser.verification_email_token = 'OK';
    existUser.verification_email_status = userConstants.STATUS_VERIFIED;
    await existUser.save();

    return res.status(HttpStatus.OK).send({
      message: "Congratulations, Email successfully verified!",
      status: HttpStatus.OK
    });

  }

  res.status(HttpStatus.UNAUTHORIZED).send({ message: 'Token code not verified!', status: HttpStatus.UNAUTHORIZED});
}

exports.resendEmailToken = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'This email is correct?');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });
  if (!existUser) {
    res.status(HttpStatus.OK).send({ message: 'User not found!', status: HttpStatus.OK});
    return 0;
  }

  let template = "welcome/welcome";

  if (req.body.template !== undefined || req.body.template !== null || req.body.template !== '') {
    template = "forget/forgot";
  }

  let token = (""+Math.random()).substring(2,6);
  existUser.verification_email_token = token;
  existUser.verification_email_status = 'pending';
  await existUser.save();

  let args = {
    to: existUser.email,
    from: "Cheffy contact@cheffy.com",
    replyTo: "contact@cheffy.com",
    subject: `Email Token`,
    template,
    context: { token, user: existUser.name }
  };
  mailer.sendMail(args);
  res.status(HttpStatus.OK).send({
    message: "Congratulations, an email with verification code has been sent!",
    status: HttpStatus.OK
  });
  return 0;
}

exports.verifyChangePassword = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])

  const existUser = await User.findOne({
    where: { id: token_return.id, password: md5(req.body.password + global.SALT_KEY) }
  });
  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
    return 0;
  }

  const code = (""+Math.random()).substring(2,6);
  existUser.verification_code = code;
  await existUser.save();

  let phone = existUser.country_code + existUser.phone_no;

  if (phone === null && phone === '' && phone === undefined) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
    return 0;
  }
  const retorno = await phoneService.forgetPassMessage(phone, code);
  res.status(HttpStatus.ACCEPTED).send(retorno);
}

exports.confirmChangePassword = async (req, res, next) => {
  if (req.body.sms_token == null || req.body.sms_token == '' || req.body.sms_token == undefined) {
    res.status(HttpStatus.CONFLICT).send({ message: 'SMS code not found!', status: HttpStatus.CONFLICT});
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
    return 0;
  }

  if (req.body.sms_token == existUser.verification_code) {
    existUser.verification_code = 'verified';
    await existUser.save();
    res.status(HttpStatus.ACCEPTED).send({
      message: "Congratulations successfully proven authenticity!",
      status: HttpStatus.ACCEPTED
    });
    return 0;
  }
  res.status(HttpStatus.CONFLICT).send({ message: "Error validating data!", status: HttpStatus.CONFLICT });
}

exports.changePassword = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'This email is correct?');
  contract.isRequired(req.body.email_token, 'This email token is required?');
  contract.isRequired(req.body.password, 'This password is required');

  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    return 0;
  }
  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
    return 0;
  }

  if (existUser.verification_email_token === req.body.email_token) {
    existUser.verification_code = 'OK';
    existUser.verification_email_status = 'verified';
    existUser.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    await existUser.save();
    res.status(HttpStatus.ACCEPTED).send({
      message: "Congratulations, password successfully changed!",
      status: HttpStatus.ACCEPTED
    });
    return 0;
  }
  res.status(HttpStatus.CONFLICT).send({ message: "Error validating data!", status: HttpStatus.CONFLICT });
}

exports.checkPhone = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.sms_token, 'SMS code not found!');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (req.body.sms_token == existUser.verification_phone_token) {
    existUser.verification_phone_token = 'OK';
    existUser.verification_phone_status = 'verified';
    await existUser.save();
    res.status(HttpStatus.OK).send({
      message: "Congratulations, phone successfully verified!",
      status: HttpStatus.OK
    });
    return 0;
  }

  res.status(HttpStatus.BAD_REQUEST).send({ message: 'SMS code not found!', status: HttpStatus.BAD_REQUEST});
}


exports.socialauth = asyncHandler(async (req, res, next) => {
    const contract = new ValidationContract();

    contract.isRequired(req.body.provider, 'provider is Required');
    contract.isRequired(req.body.provider_user_id, 'provider id is Required');
    contract.isRequired(req.body.email, 'email is Required');

    if (!contract.isValid()) {
        return res.status(HttpStatus.CONFLICT).send({message:"Review user info"});
    }
    const existUser = await User.findOne({
     where: { email: req.body.email },
     attributes: userConstants.privateSelectFields,
     include: [{
        model: ShippingAddress,
        attributes: ['addressLine1', 'addressLine2','city','state','zipCode','lat','lon'],
        as:'address'
      }]

   });
    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: 'user not found', status: HttpStatus.CONFLICT});
      return 0;
    }

    existUser.provider = req.body.provider;
    existUser.provider_user_id = req.body.provider_user_id;

    const token = await authService.generateToken({
      id: existUser.id,
      email: existUser.email,
      name: existUser.name
    });

    existUser.auth_token = token;
    existUser.verification_email_status = 'verified';

    await existUser.save();

    const userResponse = userResponseHelper({user: existUser});

    res.status(200).send({
      token: token,
      data: userResponse
    });

});


exports.socialauthRegister = asyncHandler(async (req, res, next) => {
  const contract = new ValidationContract();

  contract.isRequired(req.body.email, 'email is Required');
  contract.isRequired(req.body.name, 'name is Required');
  contract.isRequired(req.body.user_type, 'user_type is Required');
  contract.isRequired(req.body.provider, 'provider is Required');
  contract.isRequired(req.body.provider_user_id, 'provider id is Required');
  contract.isRequired(req.body.imagePath, 'imagePath id is Required');

  if (req.body.user_type === userConstants.USER_TYPE_CHEF) contract.isRequired(req.body.restaurant_name, 'Restaurant name is required!');


  if (!contract.isValid()) {
      return res.status(HttpStatus.CONFLICT).send({message:"Review user info"});
  }
  const existUser = await User.findOne({ where: { email: req.body.email } });
  if (existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'user already exists', status: HttpStatus.CONFLICT});
    return 0;
  }

  let user = {};

  user.name = req.body.name;
  user.email = req.body.email;
  user.user_type = req.body.user_type;
  user.provider = req.body.provider;
  user.provider_user_id = req.body.provider_user_id;
  user.imagePath = req.body.imagePath;

  if (user.user_type === userConstants.USER_TYPE_DRIVER) {
    await driverAPI.createDriver({
      name: user.name,
      email: user.email
    });
  }

  if (user.user_type === userConstants.USER_TYPE_CHEF) {
    user.restaurant_name = req.body.restaurant_name;
  }

  let full_data = user;
  const createdUser = await User.create({ ...full_data });

  const token = await authService.generateToken({
    id: createdUser.id,
    email: createdUser.email,
    name: createdUser.name
  });

  createdUser.auth_token = token;

  await createdUser.save();

  const existUserNew = await User.findOne({
   where: { email: req.body.email },
   attributes: userConstants.privateSelectFields,
   include: [{
      model: ShippingAddress,
      attributes: ['addressLine1', 'addressLine2','city','state','zipCode','lat','lon'],
      as:'address'
    }]

 });

  res.status(200).send({
    token: token,
    data: existUserNew
  });

});

exports.authenticate = asyncHandler(async (req, res, next) => {

  const { password } = req.body;
  debug('body', req.body);

  let customer
  var reg = new RegExp(/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/);
  let whereClause = {};

  if (reg.test(req.body.login)) {
    whereClause = { email: req.body.login };
  } else {
    const num_list = req.body.login.split(" ");
    whereClause = { country_code: num_list[0], phone_no: num_list[1] };
  }

  customer = await User.findOne({
    where: whereClause,
    include: [{
      model: ShippingAddress,
      attributes: ['addressLine1', 'addressLine2','city','state','zipCode','lat','lon'],
      as:'address'
    }]
  });

  if (!customer) {
    res.status(HttpStatus.FORBIDDEN).send({
      message: 'User does not exist in our records',
      data: null
    });
    return 0;
  }
  debug('customer', customer);
  let result = await bcrypt.compare(password, customer.password);

  if (!result) {
    return res.status(HttpStatus.FORBIDDEN).send({ message: 'Wrong password', data: null });
  }

  const doc = await Documents.findOne({ where: { userId: customer.id } });
  const token = await authService.generateToken({
    id: customer.id,
    email: customer.email,
    name: customer.name
  });

  customer.auth_token = token;
  await customer.save();

  const userResponse = userResponseHelper({user: existUser});

  res.status(200).send({
    token: token,
    data: { userResponse, user_doc: !!(doc) }
  });

  //publish create action
  events.publish({
      action: 'login',
      user: customer.get({}),
      query: req.query,
      //login can be by any user so scope is all
      scope: appConstants.SCOPE_ALL,
      type: 'user'
  }, req);

});

exports.logout = asyncHandler(async(req, res, next) =>{

    const existUser = await User.findOne({ where: { id: req.userId } });

    if (!existUser) {
      return res.status(HttpStatus.NOT_FOUND).send({ message: 'error when updating: user not found', status: HttpStatus.NOT_FOUND});
    }

    existUser.auth_token = null;

    existUser.save();

    res.status(200).send({
      message: 'successfully logged out!'
    });


})

/**
* Edit user info
*/
exports.put = asyncHandler(async (req, res, next) => {
    //for accepting form-data as well
    const body = req.body || {};
    const { password } = body;
    const existUser = await User.findOne({ where: { id: req.userId } });

    if (!existUser) {
      return res.status(HttpStatus.NOT_FOUND).send({ message: 'error when updating: user not found', status: HttpStatus.NOT_FOUND});
    }

    const prevPhone = existUser.phone_no;
    const prevEmail = existUser.email;

    const updates = userInputFilter.updateFields.filter(req.body, 'form-data');

    if(req.files && req.files['profile_photo']) {
      updates.imagePath = req.files['profile_photo'][0].url;
    }

    //need to send verification email when email change
    if(req.body.email && prevEmail !== req.body.email) {
      debug('email changed');
      let pass = (""+Math.random()).substring(2,6);
      updates.verification_email_token = pass;
      updates.verification_email_status = userConstants.STATUS_PENDING;
    }

    //need to send verification sms when phone change
    if(req.body.phone_no && prevPhone !== req.body.phone_no) {
      debug('phone changed');
      let pass = (""+Math.random()).substring(2,6);
      updates.verification_phone_token = pass;
      updates.verification_email_status = userConstants.STATUS_PENDING;
    }

    /*existUser.name = req.body.name || existUser.name;
    existUser.email = req.body.email || existUser.email;
    existUser.country_code = req.body.country_code || existUser.country_code;
    existUser.phone_no = req.body.phone_no || existUser.phone_no;
    existUser.restaurant_name = req.body.restaurant_name || existUser.restaurant_name;
    existUser.location = req.body.location  || existUser.location;
    existUser.imagePath = req.body.image_path || existUser.imagePath;*/
    (password) ? updates.password = await generateHash(password) : null ;

    await existUser.update(updates);

    const user = await User.findOne({ where: { id: req.userId }, attributes: userConstants.privateSelectFields });
    const userResponse = userResponseHelper({user});

    res.status(HttpStatus.OK).send({
      message: 'Profile successfully updated!',
      data: userResponse
    });

    //only send email/phone sms after request complete

    if(req.body.email && prevEmail !== req.body.email) {
      await sendMail({req, pass: existUser.verification_email_token});
    }

    if(req.body.phone_no && prevPhone !== req.body.phone_no) {
      let phone = existUser.country_code + existUser.phone_no;
      await phoneService.sendMessage(phone, existUser.verification_phone_token);
    }

});


/**
* DEPRECATED use shipping address API
* Update user location_lat and location_lon fields
* Sets default location/shipping_address of chef/user
*/
exports.updateLocation = asyncHandler(async(req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.location_lat, 'Field location_lat is required');
  contract.isRequired(req.body.location_lon, 'Field location_lon is required');

  if (!contract.isValid()) {
    return res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
  }

  const user = req.user;

  const updates = userInputFilter.locationFields.filter(req.body);

  await user.update(updates);

  res.status(HttpStatus.OK).send({
    message: 'Location successfully updated!',
  });

});

exports.getUserBalance = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  try {

    const existUser = await User.findOne({ where: { id: token_return.id } });
    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: 'user not found', status: HttpStatus.CONFLICT});
      return 0;
    }

    try {
      // waiting for the Wallet model to be implemented
      let userWallet = walletRepository.getUserWallet(existUser.id);
      let payload = {};
      payload.status = HttpStatus.OK;
      payload.result = userWallet;
      res.status(payload.status).send(payload);
    } catch (error) {
      res.status(HttpStatus.CONFLICT).send({ message: "An error occurred", error: true}).end();
    }

  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};



exports.getUserBalanceHistory = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  try {

    const existUser = await User.findOne({ where: { id: token_return.id } });
    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: 'user not found', status: HttpStatus.CONFLICT});
      return 0;
    }

    try {
      // waiting for the Wallet model to be implemented
      let userWallet = walletRepository.getUserWallet(existUser.id);
      let payload = {};
      payload.status = HttpStatus.OK;
      payload.result = userWallet;
      res.status(payload.status).send(payload);
    } catch (error) {
      res.status(HttpStatus.CONFLICT).send({ message: "An error occurred", error: true}).end();
    }

  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};

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
      let restaurants = await userRepository.getRestaurantSearch(req.params.text);
      let payload = {};
      payload.status = HttpStatus.OK;
      payload.plates = plates;
      payload.restaurants = restaurants;
      res.status(payload.status).send(payload);
    } catch (error) {
      res.status(HttpStatus.CONFLICT).send({ message: "An error occurred", error: true}).end();
    }

  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};

exports.searchPredictions = async (req, res, next) => {
  try {

    try {
      let type_plate = await Plates.findAll({ attributes:['id','name'] } );

      let type_chef = await Plates.findAll({
       attributes:['userId'] ,
       include:{
        model:User,
        as:"chef",

        attributes:['restaurant_name']

       }

     });
      let type_category = await PlateCategory.findAll({ attributes:['id','name'] } );

      let payload = {};
      payload.status = HttpStatus.OK;
      payload.type_plate = type_plate;
      payload.type_chef = type_chef;
      payload.type_category = type_category;
      res.status(payload.status).send(payload);
    } catch (error) {console.log(error)
      res.status(HttpStatus.CONFLICT).send({ message: "An error occurred", error: true}).end();
    }

  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};


exports.forgotPassword = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'This email is correct?');

  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });
  if (!existUser) {
    res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found!', status: HttpStatus.NOT_FOUND});
    return 0;
  }

  let template = "forget/forgot";

  let token = (""+Math.random()).substring(2,6);
  existUser.verification_email_token = token;
  existUser.verification_email_status = 'pending';
  await existUser.save();

  let args = {
    to: existUser.email,
    from: "Cheffy contact@cheffy.com",
    replyTo: "contact@cheffy.com",
    subject: `Email Token`,
    template,
    context: { token, user: existUser.name }
  };

  mailer.sendMail(args);
  res.status(HttpStatus.OK).send({
    message: "Congratulations, an email with verification code has been sent!",
    status: HttpStatus.OK
  });
  return 0;
}
