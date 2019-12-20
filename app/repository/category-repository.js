'use strict';
const { PlateCategory,PlateReview, Plates, ShippingAddress, Ingredient, PlateImage, KitchenImage, ReceiptImage, User } = require('../models/index');

exports.findExist = async (data) => {
  const existCategory = await PlateCategory.findOne({ where: { name: data } });
  return existCategory;
}

exports.findById = async (categoryId) => {
  return await PlateCategory.findByPk(categoryId);
}

exports.createCategory = async (data) => {
  const category = await PlateCategory.create({ ...data });
  return category;
}

exports.listCategories = async ({pagination}) => {
  const query = {...pagination};
  const categories = await PlateCategory.findAll(query);
  return categories;
}

exports.categoriesListPlates = async (data) => {
  let options =   {
    where: {categoryId:data},
    attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'sell_count', 'rating','categoryId', 'createdAt' ],
    include: [
      {
        model: PlateCategory,
        as: 'category',
        attributes: [ 'name', 'description', 'url' ]
      },
      {
        model: Ingredient,
        attributes: [ 'id', 'name', 'purchase_date' ]
      },
      {
        model: PlateImage,
        attributes: [ 'id', 'name', 'url' ]
      },
      {
        model: KitchenImage,
        attributes: [ 'id', 'name', 'url' ]
      },
      {
        model: ReceiptImage,
        attributes: [ 'id', 'name', 'url' ]
      },
      {
        model: PlateReview,
        attributes: [ 'comment','rating' ],
        as:'reviews',
        include: [{
          model: User,
          attributes: ['id', 'name'],
          as:'user'
        }]
      },
      {
        model: User,
        as:'chef',
        include: [{
          model: ShippingAddress,
          as:"address"
        }]
      }
    ]
  };

  try {
    const platesFromCategory = await Plates.findAll (options);
    return platesFromCategory;
  } catch (e) {
    console.log("Error: ", e);
     return { message: "Fail to get Plate!", error: e };
  }
  return categories;
}

exports.editCategory = async (id, data) => {
  const category = await PlateCategory.findByPk(id);
  /*category.name = data.name;
  category.description = data.description;
  category.url = data.url;
  await category.save();*/
  return await category.update(data);
}
