/**
* @Model: Plates
* DietCategory created by user/chef
*/
module.exports = (sequelize, DataTypes) => {

  const PlateDietCategory = sequelize.define('PlateDietCategory', {
    plateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      }
    },
    dietCategoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'DietCategories',
        key: 'id'
      }
    }
  });

  return PlateDietCategory;
}
