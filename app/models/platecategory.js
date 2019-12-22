'use strict';
/**
* @Model: PlateCategory
* categorize the plates
*/
module.exports = (sequelize, DataTypes) => {
  const PlateCategory = sequelize.define('PlateCategory', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/category_image/${this.getDataValue('url')}`;
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
  }, {});
  PlateCategory.associate = function(models) {
    PlateCategory.belongsTo(models.User, {foreignKey: 'userId'});
    //PlateCategory.hasMany(models.Plates)
  };
  return PlateCategory;
};
