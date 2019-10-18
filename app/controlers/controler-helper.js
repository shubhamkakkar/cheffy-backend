"use strict";
var HttpStatus = require("http-status-codes");
const { Order, OrderItem, User } = require("../models/index");


exports.createOrderItens = async (data) => {
  let recovery_data = data.map((item) => {
    item.chef_location = item.chef_location['dataValues'].location
    item.walletId = item.walletId[0]['dataValues'].id
    return item
  });
  const response = await OrderItem.bulkCreate(recovery_data);

}
exports.change_data = async (id, data) => {
  let base = {
    orderId: id,
    payment_id: data.id,
    amount: data.amount,
    client_secret: data.client_secret,
    customer: data.customer,
    payment_method: data.payment_method,
    status: data.status,
    receipt_url: data.charges.data[0].receipt_url,
    card_brand: data.charges.data[0].payment_method_details.card.brand,
    card_country: data.charges.data[0].payment_method_details.card.country,
    card_exp_month: data.charges.data[0].payment_method_details.card.exp_month,
    card_exp_year: data.charges.data[0].payment_method_details.card.exp_year,
    card_fingerprint: data.charges.data[0].payment_method_details.card.fingerprint,
    card_last: data.charges.data[0].payment_method_details.card.last4,
    network_status: data.charges.data[0].outcome.network_status,
    risk_level: data.charges.data[0].outcome.risk_level,
    risk_score: data.charges.data[0].outcome.risk_score,
    seller_message: data.charges.data[0].outcome.seller_message,
    type: data.charges.data[0].outcome.type,
    paid: data.charges.data[0].paid,
  }
  return base;
}
