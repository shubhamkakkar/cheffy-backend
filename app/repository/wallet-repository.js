'use strict';
const { OrderDelivery, User, Wallet } = require("../models/index");

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

exports.getUserWallet = async (userId) => {
  /*let wallet = {
    userId: userId,
    balance: 400.0,
    time: "2019-08-06 02:06:53"
  }*/

  //TODO to be implemented
  return wallet;
}

exports.getUserWalletHistory = async (userId) => {
  let wallet = {
    userId: userId,
    balance: 400.0,
    time: "2019-08-06 02:06:53",
    history: [
      {
        date: "2019-08-06 02:06:53",
        balance:200.0
      },
      {
        date: "2019-08-07 02:06:53",
        balance:400.0
      },
      {
        date: "2019-08-08 02:06:53",
        balance:300.0
      }
    ]
  }
  //TODO to be implemented
  return wallet;
}
