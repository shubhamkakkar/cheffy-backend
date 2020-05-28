'use strict';
const path = require('path');
const { OrderDelivery, User, Wallet, OrderItem} = require("../models/index");
const userConstants = require(path.resolve('app/constants/users'));
const orderItemConstants = require(path.resolve('app/constants/order-item'));
const commission = require(path.resolve('config/driverCommision'));


exports.getWallet = async (userId) => {
  const wallet = await Wallet.findOrCreate({
    defaults: {
      userId: userId
    },
    where: { userId: userId },
    attributes: [ 'id' ]
  });

  return wallet;
}

exports.getWalletData = async (userId) => {
  const wallet = await Wallet.findAll({
    where: { userId: userId },
    attributes: [ 'id', 'balance', 'tip' ]
  });
  return wallet;
}

exports.addDriversMoneyToWallet = async (userId, order_total) => {
 
    /* Considering the commission of 2% so calculating 2 percent of delivery
    amount and updating that amount balance in driver wallet */

    let commissionValue = (commission.commissionValue/100)* order_total;

    try {
      let driverWalletBalance = await Wallet.findOne({
        where: {
          userId: userId
        },
        attribute: ['balance']
      });

      if(driverWalletBalance) {
        let previousBalance = driverWalletBalance.balance
        let newBalance = previousBalance + commissionValue

        let balanceDetails = {
          balance: newBalance
        }

        return await Wallet.update(balanceDetails, {
          where: {
            userId: userId    
          }
        });

      }else{
        let total = commissionValue;
        let data = {};
        data.userId = userId;
        data.state_type = 'open';
        data.balance = total;
        await Wallet.create(data);
      }
    }catch (e) {
      throw e;
    }
  }

/**
 * Only consider the order items which are marked as approved by chef
 */
exports.addChefsMoneyToWallet = async (userId) => {
  try {

    let wallet = await Wallet.findOne({
      where: { userId: userId },
      attribute: ['balance'],
    });

    let data = {};
    const order_items = await OrderItem.findAll({
      where: { chef_id: userId, state_type:orderItemConstants.STATE_TYPE_APPROVED },
    });

    let total = 0;

    if (order_items !== null && order_items.length > 0) {
      total = order_items.reduce(function (prevVal, elem) {
        return (
          parseFloat(prevVal) +
          parseFloat(elem.amount * elem.quantity)
        );
      }, 0);
    }

    data.userId = userId;
    data.state_type = 'open';
    data.balance = total;

    if (!wallet) {
      wallet = await Wallet.create(data);
    }
    else {
      wallet.balance = total;
      await wallet.save();
    }
  }
  catch (e) {
    console.log(e);
    throw e;
  }
}
exports.addTipToWallet = async (userId, tip) => {
  try {
    let walletTip = await Wallet.findOne({
      where: { userId: userId },
      attribute: ['tip'],
    });
    
    if (walletTip) {

      let previousTip = walletTip.tip
      let newTip = previousTip + tip

      let tipDetails = {
        tip: newTip
      }

      return await Wallet.update(tipDetails, {
        where: {
          userId: userId
        }
      })
    } 
    else {
      let total = tip;
      let data = {};
      data.userId = userId;
      data.state_type = 'open';
      data.tip = total;
      await Wallet.create(data);
    }
  }
  catch (e) {
    console.log(e);
    throw e;
  }
}
