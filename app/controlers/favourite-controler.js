'use strict';
var HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const { Plates, User, PlateImage, ReceiptImage, KitchenImage, Documents } = require('../models/index');
const repository = require('../repository/plate-repository');
const repoCustom = require('../repository/customPlate-repository');
const repoFav = require('../repository/favourite-repository');
const repositoryDocs = require('../repository/docs-repository');
const md5 = require('md5');
const authService = require('../services/auth');
const upload = require('../services/upload');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;


exports.favourite = async (req, res, next) => {

  const token_return = await authService.decodeToken(req.headers['x-access-token'])

  const existUser = await User.findOne({
    where: { id: token_return.id }
  })
  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
    return 0;
  }

  let contract = new ValidationContract();
  contract.isRequired(req.body.fav_type, 'fav_type is required!');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }
  

  try {

    let response;

    if(req.body.fav_type == 'plate'){

    contract.isRequired(req.body.plateId, 'plateId is required!');

    if (!contract.isValid()) {
      res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
      return 0;
    }
    let existPlate = await repository.findPlate(req.body.plateId);
    if (!existPlate) {
      res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your plate", status: HttpStatus.CONFLICT});
      return 0;
    }

    let existPlateInFav = await repoFav.findPlateinFav(req.body.plateId);
    if (existPlateInFav) {
      res.status(HttpStatus.CONFLICT).send({ message: "Already exists in favourites", status: HttpStatus.CONFLICT});
      return 0;
    }

    response = await repoFav.add(token_return.id,null, req.body.plateId,req.body.fav_type);


    }

    if(req.body.fav_type == 'custom_plate'){
    contract.isRequired(req.body.CustomplateId, 'CustomplateId is required!');

    if (!contract.isValid()) {
      res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
      return 0;
    }
    let existPlate = await repoCustom.getPlate(req.body.CustomplateId);
    if (!existPlate) {
      res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your plate", status: HttpStatus.CONFLICT});
      return 0;
    }

    let existCustomPlateInFav = await repoFav.findCustomPlateinFav(req.body.CustomplateId);
    if (existCustomPlateInFav) {
      res.status(HttpStatus.CONFLICT).send({ message: "Already exists in favourites", status: HttpStatus.CONFLICT});
      return 0;
    }


    response = await repoFav.add(token_return.id,req.body.CustomplateId,null,req.body.fav_type);


    }

    res.status(200).send({ message: 'favourite successfully added!', data: response });
  } catch (e) {console.log(e)
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};


exports.removeFavourite = async (req, res, next) => {

  const token_return = await authService.decodeToken(req.headers['x-access-token'])

  const existUser = await User.findOne({
    where: { id: token_return.id }
  })
  if (!existUser) {
    res.status(HttpStatus.CONFLICT).send({ message: 'Error validating data', status: HttpStatus.CONFLICT});
    return 0;
  }

  let contract = new ValidationContract();
  contract.isRequired(req.params.fav_type, 'fav_type is required!');

  if (!contract.isValid()) {
    res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
    return 0;
  }
  

  try {

    let response;

    if(req.params.fav_type == 'plate'){

    contract.isRequired(req.params.id, 'plateId is required!');

    if (!contract.isValid()) {
      res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
      return 0;
    }
    let existPlate = await repository.findPlate(req.params.id);
    if (!existPlate) {
      res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your plate", status: HttpStatus.CONFLICT});
      return 0;
    }

    let existPlateInFav = await repoFav.findPlateinFav(req.params.id);
    if (!existPlateInFav) {
      res.status(HttpStatus.CONFLICT).send({ message: "Cann't find in favourites", status: HttpStatus.CONFLICT});
      return 0;
    }

    response = await repoFav.delete(existPlateInFav.id);


    }

    if(req.params.fav_type == 'custom_plate'){
    contract.isRequired(req.params.id, 'CustomplateId is required!');

    if (!contract.isValid()) {
      res.status(HttpStatus.BAD_REQUEST).send(contract.errors()).end();
      return 0;
    }
    let existPlate = await repoCustom.getPlate(req.params.id);
    if (!existPlate) {
      res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your plate", status: HttpStatus.CONFLICT});
      return 0;
    }

    let existCustomPlateInFav = await repoFav.findCustomPlateinFav(req.params.id);
    if (!existCustomPlateInFav) {
      res.status(HttpStatus.CONFLICT).send({ message: "Can't find in favourites", status: HttpStatus.CONFLICT});
      return 0;
    }


    response = await repoFav.delete(existCustomPlateInFav.id);


    }

    res.status(200).send({ message: 'favourite successfully deleted!', data: response });
  } catch (e) {console.log(e)
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};


exports.list = async (req, res, next) => {
  const token_return =  await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your favourites",
      error: true
    });
  }
  try {
    const user_favourites = await repoFav.getUserFavourites(token_return.id)
    res.status(HttpStatus.ACCEPTED).send({
      message: 'Here are your favourites!',
      data: user_favourites
    });
    return 0;
  } catch (e) {
    console.log(e)
    res.status(HttpStatus.CONFLICT).send({
      message: 'Fail to get your favourites!',
      error: true
    });
    return 0;
  }
}