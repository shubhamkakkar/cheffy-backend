'use strict';
var HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const repository = require('../repository/category-repository');
const md5 = require('md5');
const authService = require('../services/auth');

exports.create = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.name, 'The name is required!');
  contract.isRequired(req.body.url, 'Image URL is required!');
  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    return 0;
  }
  const existCategory = await repository.findExist(req.body.name);
  if (existCategory) {
    payload.status = HttpStatus.CONFLICT;
    res.status(payload.status).send({ message: 'error when registering', status: HttpStatus.CONFLICT});
    return 0;
  }
  const category = await repository.createCategory(req.body);
  res.status(HttpStatus.ACCEPTED).send({ message: "Successfully created category!", data: category });
}

exports.list = async (req, res, next) => {
  const categories = await repository.listCategories();
  res.status(HttpStatus.ACCEPTED).send(categories);
}

exports.listPlates = async (req, res, next) => {
  const categories = await repository.categoriesListPlates(req.params.id);
  res.status(HttpStatus.ACCEPTED).send(categories);
}

exports.edit = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.isRequired(req.body.name, 'The name is required!');
  contract.isRequired(req.body.url, 'Image URL is required!');
  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    return 0;
  }

  const category = await repository.editCategory(req.params.id, req.body);
  res.status(HttpStatus.ACCEPTED).send(category);
}
