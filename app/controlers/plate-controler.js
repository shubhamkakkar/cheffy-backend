'use strict';
var HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const { Plates, User, PlateImage, ReceiptImage, KitchenImage, Documents } = require('../models/index');
const repository = require('../repository/plate-repository');
const repoCustom = require('../repository/customPlate-repository');
const repositoryDocs = require('../repository/docs-repository');
const md5 = require('md5');
const authService = require('../services/auth');
const upload = require('../services/upload');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;


exports.create = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.hasMinLen(req.body.name, 3, 'The plate name should have more than 3 caracteres');
  contract.isRequired(req.body.description, 'Plate description is required!');
  contract.isRequired(req.body.price, 'Plate price is required!');
  contract.isRequired(req.body.delivery_time, 'Plate delivery time is required!');
  contract.isRequired(req.body.delivery_type, 'Plate delivery type is required!');
  contract.isRequired(req.body.categoryId, 'Caregory id is required!');
  contract.isRequired(req.body.ingredients, 'Igredients is required!');
  req.body.ingredients.map( elem => {
    contract.isRequired(elem.name, 'Igredient name is required!');
    contract.isRequired(elem.purchase_date, 'Igredient purchase date is required!');
  });
  if (!contract.isValid()) {
    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (existUser.user_type !== 'chef') {
    res.status(HttpStatus.NOT_FOUND).send({ message: "Only chefs can create plates", error: true}).end();
    return 0;
  }
  if (existUser.verification_email_status !== 'verified') {
    res.status(HttpStatus.NOT_FOUND).send({ message: "Your email was not verified", error: true}).end();
    return 0;
  }
  if (existUser.verification_phone_status !== 'verified') {
    res.status(HttpStatus.NOT_FOUND).send({ message: "Your phone number was not verified", error: true}).end();
    return 0;
  }
  const validate_docs = await Documents.findOne({ where: { userId: existUser.id } })
  if (validate_docs === null || validate_docs.state_type !== "validated") {
    res.status(HttpStatus.FORBIDDEN).send({ message: "Before creating a new plate you need to validate your documents!", error: true });
    return 0;
  }

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
}

exports.list = async (req, res, next) => {
  let retorno
  if (req.query.page && req.query.pageSize) {
    //retorno = await repository.listPlates({page: req.query.page, pageSize: req.query.pageSize})
    retorno = await repository.listPlates2(req.query)
  } else {
    let data = req.query;
    data.page=1;
    data.pageSize=10;
    retorno = await repository.listPlates2(data)
  }
  res.status(HttpStatus.ACCEPTED).send(retorno);
}

exports.listNear = async (req, res, next) => {
  let retorno = await repository.listNear({ latitude: req.query.latitude, longitude: req.query.longitude, radiusMiles: req.query.radius })
  res.status(HttpStatus.ACCEPTED).send(retorno);
}

exports.edit = async (req, res, next) => {
  try {
    let existPlate = await repository.findPlate(req.params.id);
    if (!existPlate) {
      res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your plate", status: HttpStatus.CONFLICT});
      return 0;
    }

    existPlate.name = req.body.name || existPlate.name;
    existPlate.description = req.body.description || existPlate.description;
    existPlate.price = req.body.price  || existPlate.price;
    existPlate.delivery_time = req.body.delivery_time || existPlate.delivery_time;
    existPlate.delivery_type = req.body.delivery_type || existPlate.delivery_type;
    await existPlate.save();

    const updatedPlate = await repository.findPlate(req.params.id);

    res.status(200).send({ message: 'Plate successfully updated!', data: updatedPlate });
  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};

exports.customPlates = async (req, res, next) => {
  try {
    const retorno = await repoCustom.chefGetPlates()
    res.status(HttpStatus.ACCEPTED).send(retorno);
    return 0;
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to get the custom plates",
      error: true, data: e
    });
    return 0;
  }
};

exports.customPlate = async (req, res, next) => {
  try {
    const retorno = await repoCustom.getPlate(req.params.id)
    res.status(HttpStatus.ACCEPTED).send(retorno);
    return 0;
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to get the custom plates",
      error: true, data: e
    });
    return 0;
  }
};

exports.getPlateReview = async (req, res, next) => {
  try {
    const existPlate = await repository.getPlateReviewByPlateId(req.params);
    res.status(200).send(existPlate);
  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};

exports.getRelatedPlates = async (req, res, next) => {
  try {
    const relatedPlates = await repository.getRelatedPlate(req.params.id);
    if(relatedPlates){
      res.status(200).send(relatedPlates);
    }else{
      res.status(404).send({message:"Plate not found"});
    }
  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};

// exports.createPlateReview = async (req, res, next) => {
//   try {
//     let existPlate,token_return;

//     try {
//       existPlate = await repository.getPlate(req.params.id);
//     } catch (error) {
//       res.status(409).send({ message: 'Error retrieving the plate'});
//       return;
//     }

//     if(existPlate){

//       try {
//         token_return = await authService.decodeToken(req.headers['x-access-token'])
//       } catch (error) {
//         res.status(409).send({ message: 'Token expired'});
//         return;
//       }


//       let full_data = req.body;
//       full_data.userId = token_return.id;

//         const createdPlateReview = await repository.createPlateReview(full_data);
//       res.status(200).send({ message: 'Review created!', data: createdPlateReview });
//       return;
//     }else{
//       res.status(409).send({ message: 'Plate not find!'});
//       return;
//     }

//   } catch (e) {
//     res.status(500).send({
//       message: 'Failed to process your request'
//     });
//   }
// };

exports.getPlate = async (req, res, next) => {
  try {
    const existPlate = await repository.getPlate(req.params.id);
    res.status(200).send({ message: 'Plate find!', data: existPlate });
  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};

exports.searchPlates = async (req, res, next) => {
  const list_plates = await Plates.findAll({
    where: {
      name: {
        [Op.like]: '%' + req.params.text + '%'
      }
    },
    attributes: ["name", "description", "price", "delivery_time"],
    include: [
      {
        model: PlateImage,
        attributes: [ 'id', 'url', 'name' ],
      },
      {
        model: ReceiptImage,
        attributes: [ 'id', 'url', 'name' ],
      },
      {
        model: KitchenImage,
        attributes: [ 'id', 'url', 'name' ],
      },
    ],
  });
  res.status(200).send({ message: "Plates find!", param: req.params.text, data: list_plates });
};

exports.searchLatestPlates = async (req, res, next) => {
  const retorno = await repository.searchLatestPlates({ amount: req.params.amount });
  res.status(HttpStatus.ACCEPTED).send(retorno);
};

exports.imagePlateKitchen = async (req, res, next) => {
  const { id } = req.params;
  const retorno = await PlateImage.findAll({ where: { plateId: id } });
  res.status(HttpStatus.ACCEPTED).send(retorno);
};

exports.getChefPlates = async (req, res, next) => {
  const { id } = req.params;
  const retorno = await repository.getChefPlates({ userId: id });
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
  const { id, type_image } = req.params;
  const existUser = await User.findOne({ where: { id: token_return.id } });
  
  if (existUser.user_type !== 'chef') {
    res.status(HttpStatus.CONFLICT).send({ message: "Only chefs can create plates", error: true}).end();
    return 0;
  }

  let actualImage, message;
  switch (type_image) {
    case 'plate_image':
      actualImage = await PlateImage.findOne({ where: { id }});
      message = "Plate deleted image!";
      break;
    case 'kitchen_image':
      actualImage = await KitchenImage.findOne({ where: { id }});
      message = "Kitchen deleted image!"
      break;
    case 'receipt_image':
      actualImage = await ReceiptImage.findOne({ where: { id }});
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