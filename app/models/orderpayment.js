'use strict';
module.exports = (sequelize, DataTypes) => {
  const OrderPayment = sequelize.define('OrderPayment', {
    orderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    amount: DataTypes.INTEGER,
    client_secret: DataTypes.STRING,
    created: DataTypes.STRING,
    customer: DataTypes.STRING,
    payment_method: DataTypes.STRING,
    status: {
      allowNull: true,
      type: DataTypes.ENUM('created', 'declined', 'canceled', 'pending', 'aproved'),
      defaultValue: "created",
    },
    receipt_url: DataTypes.STRING,
    card_brand: DataTypes.STRING,
    card_country: DataTypes.STRING,
    card_exp_month: DataTypes.INTEGER,
    card_exp_year: DataTypes.INTEGER,
    card_fingerprint: DataTypes.STRING,
    card_last: DataTypes.STRING,
    network_status: DataTypes.STRING,
    risk_level: DataTypes.STRING,
    risk_score: DataTypes.INTEGER,
    seller_message: DataTypes.STRING,
    type: DataTypes.STRING,
    paid: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  }, {});
  OrderPayment.associate = function(models) {
    OrderPayment.belongsTo(models.Order, {foreignKey: 'orderId', as: 'order'})
  };
  return OrderPayment;
};
