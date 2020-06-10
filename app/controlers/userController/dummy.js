("use strict");
const HttpStatus = require("http-status-codes");
const repositoryCategory = require("../../repository/category-repository");
const repository = require("../../repository/plate-repository");
const { Plates } = require("../../models/index");
const plates = require("../../../resources/plates");

module.exports = async (req, res, next) => {
  try {
    const category = await repositoryCategory.createCategory({
      name: "Dummy",
      description: "Dummy category",
      url: "#",
    });
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
      let ingred_create;

      if (ingred) {
        let ingred_data = [];
        ingred.forEach((elem) => {
          elem.plateId = plate.id;
          ingred_data.push(elem);
        });
        ingred_create = await repository.createIngredient(ingred_data);
      }

      if (images) {
        let images_data = [];
        images.forEach((elem) => {
          elem.plateId = plate.id;
          images_data.push(elem);
        });
        images_create = await repository.createPlateImage(images_data);
      }

      if (kitchen) {
        let kitchen_data = [];
        kitchen.forEach((elem) => {
          elem.plateId = plate.id;
          kitchen_data.push(elem);
        });
        kitchen_create = await repository.createKitchenImage(kitchen_data);
      }

      if (receipt) {
        let receipt_data = [];
        receipt.forEach((elem) => {
          elem.plateId = plate.id;
          receipt_data.push(elem);
        });
        receipt_create = await repository.createReceiptImage(receipt_data);
      }
    }

    return res.status(HttpStatus.OK).send({
      message: "Plates are being created",
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.log({ error });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/usercontoller/dummy",
      error,
    });
  }
};
