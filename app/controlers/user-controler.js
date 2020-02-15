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
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const paymentService = require('../services/payment');


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

exports.userResponseHelper = userResponseHelper;

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

    const { id, email, verification_email_status, password } = existUser;

    res.status(HttpStatus.OK).send({
      message: "Email Token Re-sent!",
      status: HttpStatus.OK,
      result: { id, email, verification_email_status, password_generated: !!(password), user_doc: !!(doc) }
    });

    await sendMail({req, pass});

    //publish create action
    return events.publish({
        action: 'email-token-resend',
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

  const newuser = await User.findOne({
    where: { id: user.id },
    attributes: userConstants.privateSelectFields
  });

  // payload.token = token;
  payload.result = newuser;

  payload.status = HttpStatus.CREATED;
  res.status(payload.status).send(payload);

  //send email after sending response

  await sendMail({req, pass});

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

exports.getChefBalance = asyncHandler(async (req, res, next) => {

    let wallet = await Wallet.findOne({
      where:{userId: req.userId},
      include:[

      {
        model:User,
        as:'user',
        attributes: [ 'id', 'name', 'email', 'user_type']
      }

      ]
    })


    let data = {};

    if(!wallet){
      const order_items = await OrderItem.findAll({

        where:{chef_id:req.userId}
      });

      let total = 0;

      if(order_items !== null && order_items.length > 0){

        total = order_items.reduce( function( prevVal, elem ) {
          return parseFloat(prevVal) + parseFloat(elem.amount * elem.quantity);
        }, 0 );

      }

      data.userId = req.userId;
      data.state_type = 'open';
      data.balance = total;
      wallet = await Wallet.create(data);

    }


    res.status(HttpStatus.ACCEPTED).send(wallet);


})

exports.getDriverBalance = asyncHandler(async (req, res, next) => {

    let wallet = await Wallet.findOne({
      where:{userId: req.userId},
      include:[

      {
        model:User,
        as:'user',
        attributes: [ 'id', 'name', 'email', 'user_type']
      }

      ]
    })


    res.status(HttpStatus.ACCEPTED).send(wallet);


})

exports.getUserBalanceHistory = asyncHandler(async (req, res, next) => {

        const order_items = await OrderItem.findAll({

        where:{
          [Op.and]: [{chef_id:req.userId}, {createdAt:{[Op.between]: [req.params.from, req.params.to]} }]
          
        }

      });

      const user = req.user;
      const userResponse = userResponseHelper({user});


      let total = 0;

      let balance_history = [];

      let prev_bal = 0;

      if(order_items !== null && order_items.length > 0){

        order_items.map((elem) =>{
          let hist = {};
          hist.date = elem.updatedAt;
          hist.balance = prev_bal + parseFloat(elem.amount * elem.quantity);
          prev_bal = hist.balance;
          balance_history.push(hist);

        })



        total = order_items.reduce( function( prevVal, elem ) {

          return parseFloat(prevVal) + parseFloat(elem.amount * elem.quantity);
        }, 0 );

      }


    res.status(HttpStatus.ACCEPTED).send({user: userResponse, balance_history:balance_history, total:total});


})

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
}*/

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const shippingAddresses = await user.getAddress();
  const userResponse = userResponseHelper({user});
  userResponse.address = shippingAddresses;
  res.status(HttpStatus.ACCEPTED).send({ message: 'SUCCESS', data: userResponse});

});


/**
* Complete user registration
*/
exports.completeRegistration = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'This email is correct?');
  contract.isRequired(req.body.name, 'User password is required!');
  contract.isRequired(req.body.password, 'User password is required!');
  contract.isRequired(req.body.user_type, 'User type is required!');

  if (req.body.user_type === userConstants.USER_TYPE_CHEF) {
    contract.isRequired(req.body.restaurant_name, 'Restaurant name is required!');
  }

  if (!contract.isValid()) {
    return res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });


  if (!existUser) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: `E-Mail not found, email: ${req.body.email}`,
      status: HttpStatus.BAD_REQUEST,
    });
  }
  debug('existing user', existUser.get({plain: true}));

  debug('email status: ', existUser.verification_email_status);
  if (existUser.verification_email_status !== userConstants.STATUS_VERIFIED) {
    return res.status(HttpStatus.UNAUTHORIZED).send({
      message: 'Token code not verified!',
      status: HttpStatus.UNAUTHORIZED,
    });
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

  // generate token
  const token = await authService.generateToken({
    id: existUser.id,
    email: existUser.email
  });

  // save token in user auth_token field.
  // for tracking logout
  existUser.auth_token = token;

  await existUser.save();

  const userResponse = userResponseHelper({user: existUser});

  res.status(HttpStatus.CREATED).send({
    message: `Congratulations, successfully created ${req.body.user_type} type user!`,
    status: HttpStatus.CREATED,
    result: userResponse,
    token: token
  });
});

/**
* Verify email Token
* This controller should be called when email token has been sent
* and user sends email token with email in request
*/
exports.verifyEmailToken = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'Email is correct?')
  contract.isRequired(req.body.email_token, 'This email token is required!');

  if (!contract.isValid()) {
    return res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if(!existUser) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: `User not found by email: ${req.body.email}`});
  }

  if(existUser.verification_email_status === userConstants.STATUS_VERIFIED) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Email Already Verified!', status: HttpStatus.BAD_REQUEST});
  }

  if (req.body.email_token === existUser.verification_email_token) {
    existUser.verification_email_status = userConstants.STATUS_VERIFIED;
    existUser.verification_email_token = '';
    await existUser.save();

    return res.status(HttpStatus.OK).send({
      message: "Congratulations, Email successfully verified!",
      status: HttpStatus.OK
    });

  }

  res.status(HttpStatus.UNAUTHORIZED).send({ message: 'Token code not verified!', status: HttpStatus.UNAUTHORIZED});
});

/**
* Resends email token if user doesn't receives token in email
*/
exports.resendEmailToken = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isEmail(req.body.email, 'This email is correct?');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (!existUser) {
    res.status(HttpStatus.OK).send({ message: `User not found by email: ${req.body.email}`, status: HttpStatus.OK});
    return 0;
  }

  let template = "welcome/welcome";

  if (req.body.template !== undefined || req.body.template !== null || req.body.template !== '') {
    template = "forget/forgot";
  }

  let token = (""+Math.random()).substring(2,6);
  existUser.verification_email_token = token;
  existUser.verification_email_status = userConstants.STATUS_PENDING;
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
});

/**
* Change password
* user needs to send current password as well
*/
exports.changePassword = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.password, 'Old password is required. field: password');
  contract.isRequired(req.body.newPassword, 'New password is required. field: newPassword');

  if (!contract.isValid()) {
    return res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
  }

  const existUser = req.user;

  let result = await bcrypt.compare(req.body.password, existUser.password);

  if (!result) {
    return res.status(HttpStatus.FORBIDDEN).send({ message: 'Incorrect current Password', data: null });
  }

  existUser.password = bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(10));
  await existUser.save();

  res.status(HttpStatus.ACCEPTED).send({ message: 'Password Changed Successfully' });
});

/**
* Sets phone_no and country_code in user.
* Sends sms token to phone for verification process
*/
exports.setUserPhone = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.country_code, 'Country Code is Required!');
  contract.isRequired(req.body.phone_no, 'Phone Number is Required!');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }

  const existUser = req.user;

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

/**
* Verify user phone. User sends sms_token in request
*/
exports.verifyUserPhone = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.sms_token, 'SMS code is required! field: sms_token');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }

  const existUser = req.user;

  if(existUser.verification_phone_status === userConstants.STATUS_VERIFIED) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Phone Already Verified!', status: HttpStatus.BAD_REQUEST});
  }

  if (req.body.sms_token == existUser.verification_phone_token) {
    existUser.verification_phone_token = '';
    existUser.verification_phone_status = userConstants.STATUS_VERIFIED;
    await existUser.save();
    res.status(HttpStatus.OK).send({
      message: "Congratulations, phone successfully verified!",
      status: HttpStatus.OK
    });
    return 0;
  }

  res.status(HttpStatus.BAD_REQUEST).send({ message: 'Failed verifying phone. Please try re-sending sms token again', status: HttpStatus.BAD_REQUEST});
});


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
  contract.isEmail(req.body.email, 'This email is correct?');

  if (!contract.isValid()) {
    return res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });
  if (!existUser) {
    return res.status(HttpStatus.NOT_FOUND).send({ message: 'User not found!', status: HttpStatus.NOT_FOUND});
  }

  let template = "forget/forgot";

  let token = (""+Math.random()).substring(2,6);
  existUser.password_reset_token = token;
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
  return res.status(HttpStatus.OK).send({
    message: "Congratulations, an email with verification code has been sent for reseting your password!",
    status: HttpStatus.OK
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
  contract.isEmail(req.body.email, 'This email is correct?');
  contract.isRequired(req.body.email_token, 'This email token is required?');

  if (!contract.isValid()) {
    return res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (!existUser) {
    return res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
  }

  if (existUser.password_reset_token === String(req.body.email_token)) {
    //existUser.verification_email_status = userConstants.STATUS_VERIFIED;
    // existUser.password_reset_token = '';
    // existUser.password = bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(10));
    // await existUser.save();

    return res.status(HttpStatus.ACCEPTED).send({
      message: "Your email token has been verified!",
      status: HttpStatus.ACCEPTED
    });

  }

  res.status(HttpStatus.CONFLICT).send({ message: "Error validating token!", status: HttpStatus.CONFLICT });
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
  contract.isEmail(req.body.email, 'This email is correct?');
  contract.isRequired(req.body.email_token, 'This email token is required?');
  contract.isRequired(req.body.newPassword, 'This newPassword is required');

  if (!contract.isValid()) {
    return res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (!existUser) {
    return res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
  }

  if (existUser.password_reset_token === String(req.body.email_token)) {
    // existUser.verification_email_status = userConstants.STATUS_VERIFIED;
    existUser.password_reset_token = '';
    existUser.password = bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(10));
    await existUser.save();

    return res.status(HttpStatus.ACCEPTED).send({
      message: "Congratulations, password successfully reset!",
      status: HttpStatus.ACCEPTED
    });

  }

  res.status(HttpStatus.CONFLICT).send({ message: "Error validating token!", status: HttpStatus.CONFLICT });
});




// bank endpoints

/*
Method to get stripe account details for a user
*/


exports.stripeDetails = asyncHandler(async (req, res) => {
  try{
  if (!req.user.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: "User does not have a stripe account"});
  }
  const customer = await paymentService.getUser(req.user.stripe_id);
  return res.status(HttpStatus.OK).send(customer);
}
catch(e){console.log(e)}
})


//Method to create a bank account for a user

exports.createBankAccount = asyncHandler(async (req, res, next) => {
  try{
    const existUser = req.user;
    if (!existUser.stripe_id) {
      return res.status(HttpStatus.BAD_REQUEST).send({ message: "User must have a stripe account before adding a bank account"});
    }
    const bank_account = await paymentService.createBankAccount(existUser.stripe_id, req.body);
    res.status(HttpStatus.CREATED).send({ message: "New Bank Account Created", data: bank_account});
  } catch (err) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: err.message});
  }
})


//Method to retrieve a bank account details for a user via bank account ID

exports.retrieveBankAccountById = asyncHandler(async (req, res, next) => {
  const existUser = req.user;
  if (!existUser.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: "User must have a stripe account before adding a bank account"});
  }
  const bank_account = await paymentService.retrieveBankAccountById(existUser.stripe_id, req.params.bankAccountId);
  res.status(HttpStatus.CREATED).send({ message: "Here is your Bank Account", data: bank_account});
})


//Method to retrieve all bank accounts for a user

exports.retrieveAllBankAccounts = asyncHandler(async (req, res, next) => {
  const limit = req.body.limit || 10
  const existUser = req.user;
  if (!existUser.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: "User must have a stripe account before adding a bank account"});
  }
  const bank_accounts = await paymentService.retrieveAllBankAccounts(existUser.stripe_id, limit);
  res.status(HttpStatus.CREATED).send({ message: "Here are your Bank Accounts", data: bank_accounts});
})


//Method to delete a bank account for a user

exports.deleteBankAccount = asyncHandler(async (req, res, next) => {
  const existUser = req.user;
  if (!existUser.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: "User must have a stripe account before adding a bank account"});
  }
  const deleted = await paymentService.deleteBankAccount(existUser.stripe_id, req.params.bankAccountId);
  res.status(HttpStatus.CREATED).send({ message: "Here are your Bank Accounts", data: deleted});
})


//Method to verify a bank account for a user

exports.verifyBankAccount = asyncHandler(async (req, res, next) => {
  const existUser = req.user;
  if (!existUser.stripe_id) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: "User must have a stripe account before adding a bank account"});
  }
  const bank_account = await paymentService.verifyBankAccount(existUser.stripe_id, req.params.bankAccountId);
  res.status(HttpStatus.CREATED).send({ message: "Bank Account Verified!", data: bank_account});
})


exports.getPayments = asyncHandler(async (req, res, next) => {
  try {
    if (req.user.user_type !== userConstants.USER_TYPE_DRIVER) {
      return res.status(HttpStatus.FORBIDDEN).send({ message: "Only a Driver type user can get payments to their linked Bank Account"});
    }
    const wallet = await walletRepository.getWallet(req.user.id);
    if (!wallet || !wallet[0].dataValues.balance || wallet[0].dataValues.balance <= 0) {
      return res.status(HttpStatus.BAD_REQUEST).send({ message: "Cannot transfer zero or negative wallet balance to your bank account"});
    }
    const payout = await paymentService.createPayout(wallet[0].dataValues.balance, req.body.bankAccount);
    wallet.balance = 0;
    await wallet.save();
    res.status(HttpStatus.OK).send({ message: "Congratulations! Your wallet amount will be transferred to your bank account within 7 working days.", data: payout});
  } catch (err) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: err.message});
  }
})

exports.addMoneyToWallet = asyncHandler(async (req, res, next) => {
  await walletRepository.addMoneyToWallet(req.userId, req.body.amount);
  res.status(HttpStatus.OK).send({ message: "Wallet balance updated"});
})