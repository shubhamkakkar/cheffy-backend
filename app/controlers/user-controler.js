'use strict';
var HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const { User, Wallet, OrderItem, ShippingAddress } = require('../models/index');
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

const bcrypt = require('bcrypt');



exports.create = async (req, res, next) => {
  let payload = {};

  let contract = new ValidationContract();
  contract.hasMinLen(req.body.name, 10, 'Your name should have more than 10 caracteres');
  contract.isEmail(req.body.email, 'This email is correct?');
  contract.hasMinLen(req.body.password, 6, 'Password must be longer than 6 characters!');
  contract.isRequired(req.body.user_type, 'User type is required!');

  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    return 0;
  }

  const existUser = await User.findOne({ where: { email: req.body.email } });

  if (existUser) {
    payload.status = HttpStatus.CONFLICT;
    res.status(payload.status).send({ message: 'error when registering: e-mail is already in use', status: HttpStatus.CONFLICT});
    return 0;
  }

  let full_data = req.body;

  if (full_data.user_type === 'chef') {
    if (full_data.restaurant_name === '' || full_data.restaurant_name === null || full_data.restaurant_name === undefined) {
      res.status(HttpStatus.CONFLICT).send({ message: "You need to register the restaurant name" }).end();
      return 0;
    }
  }

  const user = await User.create({ ...full_data });
  let pass = (""+Math.random()).substring(2,6);
  let name = user.name
  user.verification_email_token = pass;
  await user.save();
  let args = {
    jobName: "sendEmail",
    time: 1000,
    params: {
      to: req.body.email,
      from: "The Cheffy contact@oxigen.club",
      replyTo: "contact@oxigen.club",
      subject: `Welcome to The Cheffy ${name}!`,
      template: "welcome/welcome",
      context: { token: pass, user: name }
    }
  };
  kue.scheduleJob(args);
  const token = await authService.generateToken({
    id: user.id,
    email: user.email,
    name: user.name
  });

  const newuser = await User.findOne({
    where: { id: user.id },
    attributes: ['id', 'name', 'email', 'country_code', 'phone_no', 'user_type', 'verification_email_status', 'verification_phone_status', 'createdAt'],
  });
  payload.token = token;
  payload.result = newuser;

  payload.status = HttpStatus.CREATED;
  res.status(payload.status).send(payload);
};

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
    "name": "Natan Loterio",
    "email": "natanloterio@gmail.com",
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

exports.getUser = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token'])
    const existUser = await User.findByPk(token_return.id, {
      attributes: [ 'id', 'name', 'email', 'country_code', 'phone_no', 'auth_token', 'restaurant_name', 'location_lat', 'location_lon', 'user_type', 'imagePath', 'verification_code', 'verification_email_token', 'verification_email_status', 'verification_phone_token', 'verification_phone_status', 'status', 'user_ip', 'createdAt', 'updatedAt'],
      // include: [
      //   {
      //     model: Favorites,
      //     attributes: [ 'id', 'name' ]
      //   }
      // ]
    });
    res.status(HttpStatus.ACCEPTED).send({ message: 'SUCCESS', data: existUser});
  } catch (err) {
    res.status(HttpStatus.BAD_REQUEST).send({ message: 'FAILED', data: err});
  }
}

exports.verifyPhone = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])

  const existUser = await User.findOne({ where: { id: token_return.id } });
  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'error when registering: user not found', status: HttpStatus.CONFLICT});
    return 0;
  }
  if (req.body.country_code == null || req.body.country_code == '' || req.body.country_code == undefined) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Country code not found!', status: HttpStatus.CONFLICT});
  }
  if (req.body.phone_no == null || req.body.phone_no == '' || req.body.phone_no == undefined) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Phone number not found!', status: HttpStatus.CONFLICT});
  }

  const code = (""+Math.random()).substring(2,6);
  existUser.verification_phone_token = code;
  existUser.country_code = req.body.country_code;
  existUser.phone_no = req.body.phone_no;
  await existUser.save();

  let phone = req.body.country_code + req.body.phone_no;

  if (phone === null && phone === '' && phone === undefined) {
    res.status(HttpStatus.CONFLICT).send({ message: 'error when registering: phone not found', status: HttpStatus.CONFLICT});
    return 0;
  }

  const retorno = await phoneService.sendMessage(phone, code);

  res.status(HttpStatus.ACCEPTED).send(retorno);
}

exports.verifyEmailToken = async (req, res, next) => {
  if (req.body.email_token == null || req.body.email_token == '' || req.body.email_token == undefined) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Token code not found!', status: HttpStatus.CONFLICT});
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (req.body.email_token == existUser.verification_email_token) {
    existUser.verification_email_token = 'OK';
    existUser.verification_email_status = 'verified';
    await existUser.save();
    res.status(HttpStatus.ACCEPTED).send({
      message: "Congratulations, Email successfully verified!",
      status: HttpStatus.ACCEPTED
    });
    return 0;
  }

  res.status(HttpStatus.CONFLICT).send({ message: 'Token code not verified!', status: HttpStatus.CONFLICT});
}

exports.resendEmailToken = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });
  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Error verifying data!', status: HttpStatus.CONFLICT});
    return 0;
  }

  let token = (""+Math.random()).substring(2,6);
  existUser.verification_email_token = token;
  existUser.verification_email_status = 'pending';
  await existUser.save();
  res.status(HttpStatus.ACCEPTED).send({
    message: "Congratulations, an email with verification code has been sent!",
    status: HttpStatus.ACCEPTED
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
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
    return 0;
  }

  if (existUser.verification_code === 'verified') {
    existUser.verification_code = '';
    existUser.password = md5(req.body.password + global.SALT_KEY);
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
  if (req.body.sms_token == null || req.body.sms_token == '' || req.body.sms_token == undefined) {
    res.status(HttpStatus.CONFLICT).send({ message: 'SMS code not found!', status: HttpStatus.CONFLICT});
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (req.body.sms_token == existUser.verification_phone_token) {
    existUser.verification_phone_token = 'OK';
    existUser.verification_phone_status = 'verified';
    await existUser.save();
    res.status(HttpStatus.ACCEPTED).send({
      message: "Congratulations, phone successfully verified!",
      status: HttpStatus.ACCEPTED
    });
    return 0;
  }

  res.status(HttpStatus.CONFLICT).send({ message: 'SMS code not found!', status: HttpStatus.CONFLICT});
}

exports.authenticate = async (req, res, next) => {
  try {
    const { password } = req.body;

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

    let result = await bcrypt.compare(password, customer.password);
    
    if (!result) {
      return res.status(HttpStatus.FORBIDDEN).send({ message: 'Wrong password', data: null });
    }

    const token = await authService.generateToken({
      id: customer.id,
      email: customer.email,
      name: customer.name
    });
    res.status(200).send({
      token: token,
      data: customer
    });
  } catch (e) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Request fail',
      error: e
    });
  }
};

exports.put = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  try {

    const existUser = await User.findOne({ where: { id: token_return.id } });
    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: 'error when registering: user not found', status: HttpStatus.CONFLICT});
      return 0;
    }

    existUser.name = req.body.name || existUser.name;
    existUser.email = req.body.email || existUser.email;
    existUser.country_code = req.body.country_code || existUser.country_code;
    existUser.phone_no = req.body.phone_no || existUser.phone_no;
    existUser.restaurant_name = req.body.restaurant_name || existUser.restaurant_name;
    existUser.location = req.body.location  || existUser.location;
    existUser.imagePath = req.body.image_path || existUser.imagePath;
    await existUser.save();

    res.status(200).send({
      message: 'Profile successfully updated!',
      data: existUser
    });
  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};

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