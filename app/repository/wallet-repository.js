'use strict';
const path = require('path');
const { OrderDelivery, User, Wallet } = require("../models/index");
const userConstants = require(path.resolve('app/constants/users'));
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


exports.addMoneyToWallet = async (userId, order_total) => {


    /* Considering the commission of 2% so calculating 2 percent of delivery
    amount and updating that amount balance in driver wallet */

    let commissionValue = (commission.commissionValue/100)* order_total
    try {
      let driverWalletBalance = await Wallet.findOne({
        where: {
          userId: userId
        },
        attribute: ['balance']
      })
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
        })
      }else{
        let total = commissionValue;
        let data = {};
        data.userId = userId;
        data.state_type = 'open';
        data.balance = total;
        await Wallet.create(data);
      }
    }catch (e) {
      console.log(e)
      return (e)

    }
  }