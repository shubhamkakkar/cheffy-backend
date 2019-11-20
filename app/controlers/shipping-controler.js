"use strict";
var HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/shipping-repository");
const md5 = require("md5");
const authService = require("../services/auth");


exports.create = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.addressLine1,"It is mandatory to inform the address!");
  contract.isRequired(req.body.city, "The city field is required!");
  contract.isRequired(req.body.state, "The state field is required!");
  contract.isRequired(req.body.zipCode, "The zipcode field is required!");
  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors());
    return 0;
  }
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const existAddress = await repository.checkExistAddress({
    userId: token_return.id,
    lat: req.body.lat, 
    lon: req.body.lon
  });
  if (existAddress) {
    res
      .status(HttpStatus.CONFLICT)
      .send({ message: "You already have this address registered" });
    return 0;
  }
  let full_data = req.body;
  full_data.userId = token_return.id;

  const address = await repository.createAddress(full_data);
  res
    .status(HttpStatus.ACCEPTED)
    .send({ message: "Successfully created shipping address!", data: address });

}
exports.list = async (req, res, next) => {
  let retorno;
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  if (req.query.page && req.query.pageSize) {
    retorno = await repository.listAddress({
      userId: token_return.id,
      page: req.query.page,
      pageSize: req.query.pageSize
    });
  } else {
    retorno = await repository.listAddress({
      userId: token_return.id,
      page: 1,
      pageSize: 5
    });
  }
  res.status(HttpStatus.ACCEPTED).send(retorno);
};

exports.edit = async (req, res, next) => {
  try {
    let existAddress = await repository.getExistAddress(req.params.id);
    if (!existAddress) {
      res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your shipping address", status: HttpStatus.CONFLICT});
      return 0;
    }
    const token_return = await authService.decodeToken(req.headers['x-access-token']);

    if (existAddress.userId !== token_return.id) {
      res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your shipping address", status: HttpStatus.CONFLICT});
      return 0;
    }

    let contract = new ValidationContract();
    contract.isRequired(req.body.addressLine1,"It is mandatory to inform the address!");
    contract.isRequired(req.body.city, "The city field is required!");
    contract.isRequired(req.body.state, "The state field is required!");
    contract.isRequired(req.body.zipCode, "The zipcode field is required!");
    if (!contract.isValid()) {
      res.status(HttpStatus.CONFLICT).send(contract.errors());
      return 0;
    }

    existAddress.addressLine1 = req.body.addressLine1;
    existAddress.addressLine2 = req.body.addressLine2;
    existAddress.city = req.body.city;
    existAddress.state = req.body.state;
    existAddress.zipCode = req.body.zipCode;
    existAddress.lat = req.body.lat;
    existAddress.lon = req.body.lon;
    await existAddress.save();

    const updatedAddress = await repository.getExistAddress(req.params.id);

    res.status(200).send({ message: 'Address successfully updated!', data: updatedAddress });
  } catch (e) {
    console.log("Error: ", e);
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};