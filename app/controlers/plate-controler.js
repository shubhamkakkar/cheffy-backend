'use strict';
const path = require('path');
const HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const { Plates, User, PlateImage, ReceiptImage, KitchenImage, OrderFrequency } = require('../models/index');
const repository = require('../repository/plate-repository');
const repoCustom = require('../repository/customPlate-repository');
const repositoryDocs = require('../repository/docs-repository');
const repositoryOrder = require(path.resolve('app/repository/order-repository'));
const md5 = require('md5');
const _ = require('lodash');
const authService = require('../services/auth');
const upload = require('../services/upload');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const documentConstants = require(path.resolve('app/constants/documents'));
const asyncHandler = require('express-async-handler');
const plateInputFilter = require(path.resolve('app/inputfilters/plate'));
const events = require(path.resolve('app/services/events'));
const appConstants = require(path.resolve('app/constants/app'));
const paginator = require(path.resolve('app/services/paginator'));

/**
* Get plate by plateId
* Middleware
*/
exports.getPlateByIdMiddleware = asyncHandler(async (req, res, next, plateId) => {
    const existPlate = await repository.getPlateById(plateId);
    if(!existPlate) {
      return res.status(HttpStatus.NOT_FOUND).send({message: `Plate not found by id: ${plateId}`});
    }

    req.plate = existPlate;
    next();
});


exports.create = asyncHandler(async (req, res, next) => {
  let contract = new ValidationContract();
  contract.hasMinLen(req.body.name, 3, 'The plate name should have more than 3 caracteres');
  contract.isRequired(req.body.description, 'Plate description is required!');
  contract.isRequired(req.body.price, 'Plate price is required!');
  contract.isRequired(req.body.delivery_time, 'Plate delivery time is required!');
  contract.isRequired(req.body.delivery_type, 'Plate delivery type is required!');

  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (existUser.user_type !== 'chef') {
    res.status(HttpStatus.CONFLICT).send({ message: "Only chefs can create plates", error: true}).end();
    return 0;
  }
  if (existUser.verification_email_status !== 'verified') {
    res.status(HttpStatus.CONFLICT).send({ message: "Your email was not verified", error: true}).end();
    return 0;
  }
  if (existUser.verification_phone_status !== 'verified') {
    res.status(HttpStatus.CONFLICT).send({ message: "Your phone number was not verified", error: true}).end();
    return 0;
  }
  const validate_docs = await repositoryDocs.getUserDocs(existUser.id)
  if (validate_docs === null || validate_docs.state_type !== documentConstants.STATUS_APPROVED) {
    return res.status(HttpStatus.CONFLICT).send({ message: "Before creating a new plate you need to validate your documents!", error: true });
  }

  /*const loc = await repositoryOrder.userLocation(existUser.id);
  if(!loc) {
    return res.status(HttpStatus.CONFLICT).send({message: 'Before creating a new plate you need to create shipping address', error: true});
  }*/

  let full_data = req.body;
  let ingred;

  full_data.userId = existUser.id;

  if (full_data.ingredients) {
    ingred = full_data.ingredients;
    delete full_data.ingredients;
  }

  let plate = await Plates.create({ ...full_data });
  let ingred_create;

  if (ingred) {
    let ingred_data = []
    ingred.forEach(elem => {
      elem.plateId = plate.id;
      ingred_data.push(elem);
    })
    ingred_create = await repository.createIngredient(ingred_data)
  }

  let payload = {};

  payload.status = HttpStatus.CREATED;
  payload.plate = plate;
  payload.ingredients = ingred_create;
  res.status(payload.status).send(payload);
});


exports.getPlate = asyncHandler(async (req, res, next) => {

  const detailPlate = await repository.getPlate({req, plateId: req.params.id});

  res.status(200).send({ message: 'Plate find!', data: detailPlate });

  events.publish({
      action: appConstants.ACTION_TYPE_VIEWED,
      user: req.user,
      plate: req.plate,
      scope: appConstants.SCOPE_ALL,
      type: 'plate'
  }, req);

});

exports.edit = asyncHandler(async (req, res, next) => {

  let existPlate = req.plate;

  const updates = plateInputFilter.createFilters.filter(req.body);

  existPlate = await existPlate.update(updates);

  res.status(200).send({ message: 'Plate successfully updated!', data: existPlate });

});

exports.delete = asyncHandler(async (req, res, next) => {

  let existPlate = req.plate;

  return res.status(HttpStatus.BAD_REQUEST).send({message: "Feature not implemented"});
  //TODO
});

exports.getPlateReview = asyncHandler(async (req, res, next) => {
  const existPlate = await repository.getPlateReviewByPlateId(req.params);
  res.status(200).send(existPlate);
});


/**
* New Plates search API
* Filter based on various parameters
* Show Near plates
*/
exports.list = asyncHandler(async (req, res, next) => {

  const query = {req, query: req.query, pagination: paginator.paginateQuery(req)};

  const plates = await repository.searchPlates(query)

  res.status(HttpStatus.ACCEPTED).send({
    message: "Plates",
    ...paginator.paginateInfo(query),
    data: plates
  });

  //publish search action
  events.publish({
      action: 'searched',
      user: req.user,
      query: req.query,
      params: req.params,
      //registration can be by any user so scope is all
      scope: appConstants.SCOPE_ALL,
      type: 'plate'
  }, req);

});

/**
* Method: GET
* Help route for palte search/filter
*/
exports.searchHelp = asyncHandler( async (req, res, next) => {
  return res.status(HttpStatus.OK).send({
    message: 'Search Plates API help',
    query: {
      // field related filters
      exactFieldRelated: [
        { keyword: 'Search plate by name/characters', type: 'String' },
        { related: 'Search related plates for a plate', type: 'plateId' },
        { userId: 'Search by userId', type: 'user' },
        { price: 'Search by exact price', type: 'Decimal' },
        { delivery_time: 'Search by exact delivery time', type: 'Decimal' },
        { delivery_type: 'Search by delivery_type i.e free|paid', type: 'String: free|paid' },
        { plateAvailable: 'Search chef available plates', type: 'Boolean' },
        { chefDeliveryAvailable: 'Search plates available for delivery', type: 'Boolean' },
        { categoryId: 'Search plates by categoryId', type: 'categoryId' },
      ],
      // distance related filters
      distanceRelated: [
        { near: 'Search near plates', type: 'Boolean' },
        { radius: 'Search near plates filter by radius distance', type: 'Decimal' },
        { radiusUnit: 'Distance unit. One of miles | km', type: 'String: miles|km' } ,
        { lat: 'search plates near latitude', type: 'Decimal' },
        { lon: 'search plates near longitude', type: 'Decimal' },
      ],
      categoryRelated: [
        {
          sortCategory: 'Sort plates based on various category.',
          type: 'Number: 0,1,2,3',
          options: {
            '0': 'default',
            '1': 'popular',
            '2': 'rating',
            '3': 'deliveryTime',
          },
        },
        {
          sort: 'Sort by all available plate fields. For eg. to sort by newest',
          type: 'String',
          example: '?sort=createdAt',
        },
        {
          sortType: 'Ascending or Descending. Default is Descending',
          type: 'String: ASC| DESC.',
          example: '?sortType=ASC',
        },
        { deliveryPrice: 'Search by average delivery Price', type: 'Decimal' },
        {
          priceRange: 'Search plates filter price type',
          type: 'Number: 1,2,3',
          options: {
            '1': 'low',
            '2': 'medium',
            '3': 'expensive'
          },
        },
        {
          priceRange: 'Search plates by price range',
          type: 'Array[Number]',
          example: '?priceRange=1.5&priceRange=2.5'
        },
        { deliveryPrice: 'Distance unit. One of miles | km', type: 'String: miles|km'},
        { dietary: 'search plates by diet category', type: 'String' },
      ]
    }

  });
});


exports.getChefPlates = [
  async (req, res, next) => {
    const { chefId } = req.params;
    req.query.userId = chefId;
    next();
  },
  exports.list
];


exports.getRelatedPlates = [
  async (req, res, next) => {
    req.query.related = req.params.id;
    next();
  },
  exports.list
];


exports.categoryPlates = [
  async (req, res, next) => {
    req.query.categoryId = req.params.categoryId;
    next();
  },
  exports.list
];




exports.imagePlateKitchen = async (req, res, next) => {
  const { id } = req.params;
  const retorno = await PlateImage.findAll({ where: { plateId: id } });
  res.status(HttpStatus.ACCEPTED).send(retorno);
};

exports.listReceipt = async (req, res, next) => {
  const { id } = req.params;
  const retorno = await ReceiptImage.findOne({ where: { plateId: id } });
  res.status(200).send({ message: "Receipt find!", data: retorno });
};

exports.uploadImages = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const { id } = req.params;
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (existUser.user_type !== 'chef') {
    res.status(HttpStatus.CONFLICT).send({ message: "Only chefs can create plates", error: true}).end();
    return 0;
  }

  const actualPlate = await Plates.findOne({ where: { id }});
  if (!actualPlate) {
    await Object.keys(req.files).map(async keyObject => {
      await req.files[keyObject].map(async file => {
        const { fieldname, key } = file;
        await uploadService.deleteImage(fieldname, key);
      });
    });

    res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your plate", status: HttpStatus.CONFLICT});
    return 0;
  }

  if (req.files.plate_image.length > 0) {
    let plateImages = [];
    let kitchenImages = [];
    let receiptImages = [];
    await Object.keys(req.files).map(async keyObject => {
      switch (keyObject) {
        case 'plate_image':
          req.files[keyObject].map(plateImage => plateImages.push({ name: plateImage.originalname, url: plateImage.key, plateId: actualPlate.id }));
          break;
        case 'kitchen_image':
          req.files[keyObject].map(plateImage => kitchenImages.push({ name: plateImage.originalname, url: plateImage.key, plateId: actualPlate.id }));
          break;
        case 'receipt_image':
          req.files[keyObject].map(plateImage => receiptImages.push({ name: plateImage.originalname, url: plateImage.key, plateId: actualPlate.id }));
          break;
        default:
          break;
      }
    });
    let returnPlateImages, returnKitchenImages, returnReceiptImages = [];

    if (plateImages.length > 0)
      returnPlateImages = await repository.createPlateImage(plateImages);
    if (kitchenImages.length > 0)
      returnKitchenImages = await repository.createKitchenImage(kitchenImages);
    if (receiptImages.length > 0)
      returnReceiptImages = await repository.createReceiptImage(receiptImages);

    res.status(200).send({
      message: "Plates images created!",
      data: {
        plate_image: returnPlateImages,
        kitchen_image: returnKitchenImages,
        receipt_image: returnReceiptImages
      }});
  }


};

exports.deleteImage = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const { plateImageId, type_image } = req.params;
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (existUser.user_type !== 'chef') {
    res.status(HttpStatus.CONFLICT).send({ message: "Only chefs can create plates", error: true}).end();
    return 0;
  }

  let actualImage, message;
  switch (type_image) {
    case 'plate_image':
      actualImage = await PlateImage.findOne({ where: { plateImageId }});
      message = "Plate deleted image!";
      break;
    case 'kitchen_image':
      actualImage = await KitchenImage.findOne({ where: { plateImageId }});
      message = "Kitchen deleted image!"
      break;
    case 'receipt_image':
      actualImage = await ReceiptImage.findOne({ where: { plateImageId }});
      message = "Receipt deleted image!"
      break;
    default:
      break;
  }

  if (!actualImage) {
    res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your image for id", status: HttpStatus.CONFLICT});
    return 0;
  }

  const actualPlate = await Plates.findOne({ where: { id: actualImage.plateId }});

  if (!actualPlate) {
    res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your plate", status: HttpStatus.CONFLICT});
    return 0;
  }

  await upload.deleteImage(type_image, actualImage.getDataValue('url'));

  switch (type_image) {
    case 'plate_image':
      await repository.deletePlateImage(id);
      break;
    case 'kitchen_image':
      await repository.deleteKitchenImage(id);
      break;
    case 'receipt_image':
      await repository.deleteReceiptImage(id);
      break;
    default:
      break;
  }

  res.status(200).send({ message: message, data: actualImage });
};


exports.popularPlates = async (req, res, next) => {try{

  let list = await repository.popularPlates();

  let popular_plates = [];

  for(let i=0;i<list.length;i++){

    popular_plates.push(list[i].plate_1);

    popular_plates.push(list[i].plate_2);

  }


  const unique = popular_plates
       .map(e => e['id'])

    .map((e, i, final) => final.indexOf(e) === i && i)

    .filter(e => popular_plates[e]).map(e => popular_plates[e]);

  res.status(200).send({ message: "Popular Plates!", data: unique });
}catch(e){console.log(e)}
};