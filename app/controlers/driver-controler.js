'use strict';
var HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const driverAPI = require('../services/driverApi');
const { User } = require('../models/index');
const authService = require("../services/auth");

exports.updateDriverPosition = async (req, res, next) => {
    let payload = {};

    let contract = new ValidationContract();
    contract.isRequired(req.body.latitude, 'You must provide latitude');
    contract.isRequired(req.body.longitude, 'You must provide longitude');
  
    if (!contract.isValid()) {
      res.status(HttpStatus.CONFLICT).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
      return 0;
    }

    const token_return = await authService.decodeToken(req.headers['x-access-token'])

    const existUser = await User.findOne({ where: { id: token_return.id } });

    if (!existUser || existUser.user_type !== 'driver') {
      payload.status = HttpStatus.CONFLICT;
      res.status(payload.status).send({ message: 'Could not update user position', status: HttpStatus.CONFLICT});
      return 0;
   }
   let response;
   try {
      response = await driverAPI.updateDriverPosition({
       email: existUser.email,
       lat: req.body.latitude,
       lng: req.body.longitude
      });
   } catch (err) {
      res.status(HttpStatus.CONFLICT).send({ message: `Conflict in request Driver API ${err.config.url}` }).end();
      return 0;
   }
   
   res.status(HttpStatus.ACCEPTED).send({ ...response.data });
}

exports.getDriverPosition = async (req, res, next) => {
   const token_return = await authService.decodeToken(req.headers['x-access-token']);
   const existUser = await User.findOne({ where: { id: token_return.id } });
   let payload = {};
   if (!existUser || existUser.user_type !== 'driver') {
      payload.status = HttpStatus.CONFLICT;
      res.status(payload.status).send({ message: 'Could not update user position', status: HttpStatus.CONFLICT});
      return 0;
   }
   
   let contract = new ValidationContract();
   contract.isEmail(req.body.email, 'This email is correct?');
 
   if (!contract.isValid()) {
     res.status(HttpStatus.CONFLICT).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
     return 0;
   }
   let response;
   try {
      response = await driverAPI.getDriverPosition({
         email: existUser.email,
      });
   } catch (err) {
      res.status(HttpStatus.CONFLICT).send({ message: `Conflict in request Driver API ${err.config.url}` }).end();
      return 0;
   }

   res.status(HttpStatus.ACCEPTED).send({ ...response.data });
}

exports.createBankAccount = async (req, res, next) => {
   const token_return = await authService.decodeToken(req.headers['x-access-token']);
   const existUser = await User.findOne({ where: { id: token_return.id } });
   if (!existUser || existUser.user_type !== 'driver') {
      res.status(payload.status).send({ message: 'Driver not found!', status: HttpStatus.CONFLICT});
      return 0;
   }

   let contract = new ValidationContract();
   contract.isRequired(req.body.name, 'Name is required!');
   contract.isEmail(req.body.email, 'This email is correct?');
   contract.isAccountNumber(req.body.account_number, 'This bankAccount is correct?');
   contract.isTaxInformation(req.body.taxInformation, 'This Tax Information is correct?');

   if (!contract.isValid()) {
      res.status(HttpStatus.CONFLICT).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
      return 0;
   }
   let response;
   try {
      response = await driverAPI.createBankAccount({
         email: existUser.email,
         name: req.body.name,
         account_number: req.body.account_number,
         tax_information: req.body.taxInformation
      });
   } catch (err) {
      res.status(HttpStatus.CONFLICT).send({ message: `Conflict in request Driver API ${err.config.url}` }).end();
      return 0;
   }

   res.status(HttpStatus.ACCEPTED).send({ ...response.data });  
}