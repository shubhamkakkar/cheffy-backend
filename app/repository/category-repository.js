'use strict';
const { PlateCategory,Review, Plates, ShippingAddress, Ingredient, PlateImage, KitchenImage, ReceiptImage, User } = require('../models/index');

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

exports.editCategory = async (id, data) => {
  const category = await PlateCategory.findByPk(id);
  /*category.name = data.name;
  category.description = data.description;
  category.url = data.url;
  await category.save();*/
  return await category.update(data);
}
