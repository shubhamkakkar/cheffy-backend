'use strict';
const path = require('path');
const { generateHash } = require('../../helpers/password');
const userConstants = require(path.resolve('app/constants/users'));

/**
* @Model: User
* User Table
*/
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    country_code: DataTypes.STRING,
    phone_no: DataTypes.STRING,
    auth_token: DataTypes.STRING,
    restaurant_name: DataTypes.STRING,
    password: DataTypes.STRING,
    location_lat: DataTypes.DECIMAL(10,8),
    location_lon: DataTypes.DECIMAL(10,8),
    user_type: DataTypes.ENUM(userConstants.USER_TYPE_USER, userConstants.USER_TYPE_CHEF, userConstants.USER_TYPE_ADMIN, userConstants.USER_TYPE_DRIVER),
    imagePath: DataTypes.STRING,
    verification_code: DataTypes.STRING,
    verification_email_token: DataTypes.STRING,
    verification_email_status: DataTypes.ENUM(userConstants.STATUS_PENDING, userConstants.STATUS_VERIFIED),
    verification_phone_token: DataTypes.STRING,
    verification_phone_status: DataTypes.ENUM(userConstants.STATUS_PENDING, userConstants.STATUS_VERIFIED),
    status: DataTypes.INTEGER,
    user_ip: DataTypes.STRING,
    stripe_id: DataTypes.STRING,
    provider: DataTypes.STRING,
    provider_user_id: DataTypes.STRING,

  });

  User.associate = function(models) {
    User.hasMany(models.Plates)
    User.hasMany(models.OrderDelivery, {foreignKey: 'driverId'});
    User.hasMany(models.Order);
    User.hasMany(models.ShippingAddress,{as: 'address'});
    User.hasMany(models.CustomPlateAuctionBid);
    User.hasMany(models.PlateReview);
    User.hasOne(models.Documents);
    User.hasOne(models.Basket);
    User.hasOne(models.Wallet);
    User.hasOne(models.Transactions);
  }
  return User;
}
