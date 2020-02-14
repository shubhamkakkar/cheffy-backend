'use strict';
const path = require('path');
const paymentConfig = require(path.resolve('config/payment'));

const stripe = require('stripe')(paymentConfig.stripe.client_secret);
const paypal = require('paypal-rest-sdk');
const debug = require('debug')('payment-service');

stripe.setMaxNetworkRetries(3);
exports.createSession = async (userID, list_items, address) => {

  const session = await stripe.checkout.sessions.create({
    customer: userID,
    payment_method_types: ['card'],
    submit_type: "pay",
    line_items: list_items,
    payment_intent_data: {
      shipping: {
        name: 'home',
        address: {
          line1: address.addressLine1,
          line2: address.addressLine2,
          city: address.city,
          state: address.state,
          postal_code: address.zipCode,
        }
      }
    },
    success_url: paymentConfig.stripe.success_url,
    cancel_url: paymentConfig.stripe.cancel_url,
  });
  return session;
}

/**
* Create Stripe Customer for future recurring payments and saving cards
* customer_id will be sent by stripe which will be saved in user.stripe_id
*/
exports.createUser = async (user, address) => {
  debug("STRIPE Create user: ", user.email);
  const user_req = await stripe.customers.create({
    email: user.email,
    name: user.name,
    address: {
      line1: address.addressLine1,
      line2: address.addressLine2,
      city: address.city,
      state: address.state,
      postal_code: address.zipCode,
    },
    shipping: {
      name: 'home',
      address: {
        line1: address.addressLine1,
        line2: address.addressLine2,
        city: address.city,
        state: address.state,
        postal_code: address.zipCode,
      }
    }
  });
  return user_req;
}

/**
* Update Stripe customer
*/
exports.updateUser = async (user, updates) => {
  debug("STRIPE Update user: ", user.email);
  const updatedResponse = await stripe.customers.update(user.stripe_id, updates);
  return updatedResponse;
}

/**
* Retrieve Stripe Customer by stripeId
*/
exports.getUser = async (userStripeId) => {
  debug("STRIPE Get user: ", userStripeId)
  const user_req = await stripe.customers.retrieve(userStripeId);
  return user_req;
}

/**
* ADMIN
* List all customers in stripe
*/
exports.listUsers = async (query) => {
  const data = await stripe.customers.list(query);
  return data;
}


/**
* ADMIN
* Delete Stripe Customer
*/
exports.deleteUser = async (user) => {
  debug("STRIPE Delete user: ", user.stripe_id);
  const updatedResponse = await stripe.customers.del(user.stripe_id);
  return updatedResponse;
}


/**
* List paymentMethods of a user of 'card' type from stripe
*/
exports.getUserCardsList = async (stripeCustomerId, queryOptions = {}) => {
  debug("STRIPE Get user cards: ", stripeCustomerId)
  // const user_req = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card', ...queryOptions });
  const user_req = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card' });
  return user_req;
}

/**
* Creates payment Method of type card for a customer
*/
exports.createCard = async (user, address, card) => {
  debug("STRIPE Create card: ", card.cvc)
  const card_req = await stripe.paymentMethods.create({
    type: "card",
    card: {
      number: card.number,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      cvc: card.cvc,
    },
    billing_details: {
      name: user.name,
      email: user.email,
      phone: user.country_code + user.phone_no,
      address: {
        line1: address.addressLine1,
        line2: address.addressLine2,
        city: address.city,
        state: address.state,
        postal_code: address.zipCode,
      }
    }
  });
  return card_req;
}

exports.attachPaymentMethod = async (card, user) => {
  const card_req = await stripe.paymentMethods.attach(card, { customer: user });
  return card_req;
}

exports.confirmPayment = async (ammount, card, customer) => {
  debug("STRIPE Confirm payment: ", card)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: ammount,
    currency: 'usd',
    payment_method_types: ['card'],
    customer: customer,
    payment_method: card,
    confirm: true,
  });
  return paymentIntent;
}

exports.createPayout = async (amount, bankAccount) => {
  let payload = {
    amount: amount,
    currency: 'usd'
  }
  if (bankAccount) {
    payload.destination = bankAccount
  }
  const payout = await stripe.payouts.create(payload)
  return payout;
}

//STRIPE METHOD
/**
  try {
    //create user at strip system payment
    const user_return = await paymentService.createUser(user_data, user_address);
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to create your payment data!',
      data: e,
      error: true
    });
    return 0;
  }
  try {
    //create Card at Strip system payment
    const card_return = await paymentService.createCard(user_data, user_address, req.body.card);
  } catch (e) {
    debug("createCard: ", e)
    let retorn = {
      orderId: create_order.id,
      payment_id: null,
      amount: total_cart,
      client_secret: null,
      customer: e.raw.requestId,
      payment_method: null,
      status: e.raw.code,
      receipt_url: null,
      card_brand: null,
      card_country: null,
      card_exp_month: null,
      card_exp_year: null,
      card_fingerprint: null,
      card_last: null,
      network_status: null,
      risk_level: null,
      risk_score: null,
      seller_message: e.raw.message,
      type: e.raw.type,
      paid: false,
    }
    await repositoryOrderPayment.create(retorn);
    await repository.editState(create_order.id, 'declined')
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to validate your card!',
      data: e,
      error: true
    });
    return 0;
  }

  let user_card = await paymentService.attachPaymentMethod(card_return.id, user_return.id);

  try {
    const confirm = await paymentService.confirmPayment(total_cart, user_card.id, user_return.id);
  } catch (e) {
    debug("confirmPayment: ", e)
    await repository.editState(create_order.id, 'declined')
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to confirm your payment!',
      data: e,
      error: true
    });
    return 0;
  }
 */

/**
 * if (create_orderPayment.status === 'succeeded' && create_orderPayment.type === 'authorized') {
   await repository.editState(create_order.id, 'aproved')

   let bulkTransactions = cart_itens.map(elem => (
     {
       identifier:'order_payment',
       userId:elem.chef_id,
       orderId:create_order.id,
       orderPaymentId:create_orderPayment.id,
       amount:elem.amount
     }
   ))

   let transactionsService = new TransactionsService();
   transactionsService.recordBulkCreditTransaction(bulkTransactions)

   res.status(HttpStatus.ACCEPTED).send({
     message: 'Your order was successfully paid!',
     payment_return: create_orderPayment
   });
   return 0;
 }
 */

exports.payPalConnection = async () => await paypal.configure({
  'mode': 'sandbox',
  'client_id': 'AX0rIM3otenMBgA2oLXLs0OmV1WsJxNTYOjXoML5J1yv-qe_g6Bj_9pPhQ-dW6PQ5EShQSadLF-UxRNj',
  'client_secret': 'ELJGz7y4lKWoRVPdrnxfqUt0NOvFucR9w6_6iGkNVFn7HyBL0QCSYDqwRLrBCPIoOnlHzfSAoAD8EN9f'
});
