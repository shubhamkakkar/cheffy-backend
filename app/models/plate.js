/**
* @Model: Plates
* Plate created by chef
*/
module.exports = (sequelize, DataTypes) => {
  const Plate = sequelize.define('Plates', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    delivery_time: DataTypes.DOUBLE,
    sell_count: DataTypes.DOUBLE,
    delivery_type: {
      type: DataTypes.ENUM('free', 'paid'),
      defaultValue: 'paid',
    },
    //this field shows whether the plate is currently prepated by the chef or not
    available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    chefDeliveryAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'PlateCategory',
        key: 'id'
      }
    },
    rating: DataTypes.DOUBLE
  });
  Plate.associate = function(models) {
    Plate.belongsTo(models.User, {foreignKey: 'userId', as: 'chef', onDelete: 'cascade'})
    Plate.belongsTo(models.PlateCategory, {foreignKey: 'categoryId', as: 'category', onDelete: 'cascade'})
    Plate.hasMany(models.Ingredient)
    Plate.hasMany(models.PlateImage)
    Plate.hasMany(models.KitchenImage)
    Plate.hasMany(models.ReceiptImage)
    Plate.hasMany(models.Review, {as: 'reviews'})
  }
  return Plate;
}
