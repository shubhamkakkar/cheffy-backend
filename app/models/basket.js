'use strict';
module.exports = (sequelize, DataTypes) => {
  const Basket = sequelize.define('Basket', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
  }, {});
  Basket.associate = function(models) {
    Basket.belongsTo(models.User, {foreignKey: 'userId', as: 'user', onDelete: 'cascade'})
    Basket.hasMany(models.BasketItem);
    Basket.hasMany(models.Order);
  };
  return Basket;
};
