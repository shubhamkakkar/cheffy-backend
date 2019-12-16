'use strict';
const path = require('path');
const orderPaymentConstants = require(path.resolve('app/constants/order-payment'));

/**
* @Model: OrderPayment
* Stores payment for a particular order
*/
module.exports = (sequelize, DataTypes) => {
  const OrderPayment = sequelize.define('OrderPayment', {
    orderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    //amount in cents
    amount: DataTypes.INTEGER,
    
    client_secret: DataTypes.STRING,
    created: DataTypes.STRING,
    customer: DataTypes.STRING,
    payment_method: DataTypes.STRING,
    status: {
      allowNull: false,
      type: DataTypes.ENUM(
        orderPaymentConstants.STATUS_PROCESSING,
        orderPaymentConstants.STATUS_REQUIRES_PAYMENT_METHOD,
        orderPaymentConstants.STATUS_REQUIRES_CONFIRMATION,
        orderPaymentConstants.STATUS_REQUIRES_CAPTURE,
        orderPaymentConstants.STATUS_CANCELED,
        orderPaymentConstants.STATUS_SUCCEEDED
      ),
      defaultValue: orderPaymentConstants.STATUS_PROCESSING,
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
