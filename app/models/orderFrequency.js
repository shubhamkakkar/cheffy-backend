'use strict';
/**
* @Model: orderFrequency
* This model will be used for determining the strength of relationship between two plates. 
* This will be used in 'people also added' API
*/

module.exports = (sequelize, DataTypes) => {
  const OrderFrequency = sequelize.define('OrderFrequency', {
    plate1: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      },
      primaryKey: true 
    }, 
    plate2: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      },
      primaryKey: true
    },

    frequency: {
      type: DataTypes.INTEGER,
    },

}, {});
  OrderFrequency.associate = function(models) {

    OrderFrequency.belongsTo(models.Plates, {foreignKey: 'plate1', as: 'plate_1', onDelete: 'cascade'});
    OrderFrequency.belongsTo(models.Plates, {foreignKey: 'plate2', as: 'plate_2', onDelete: 'cascade'});
    
  };

  OrderFrequency.removeAttribute('id');

  return OrderFrequency;
};
