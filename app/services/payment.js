'use strict';
const stripe = require('stripe')('sk_test_2888PDo1zMy6jXKzDGlvCxSY00KOOW8SPZ');
stripe.setMaxNetworkRetries(3);


exports.createSession = async (userID, list_itens, address) => {

  const session = await stripe.checkout.sessions.create({
    customer: userID,
    payment_method_types: ['card'],
    submit_type: "pay",
    line_items: list_itens,
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
    success_url: 'http://146a3f91.ngrok.io/payment/success',
    cancel_url: 'http://146a3f91.ngrok.io/payment/cancel',
  });
  return session;
}

exports.createUser = async (user, address) => {
  console.log("STRIPE Create user: ", user.email);
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

exports.getUser = async (user) => {
  console.log("STRIPE Get user: ", user)
  const user_req = await stripe.customers.retrieve(user);
  return user_req;
}

exports.getUserCardsList = async (user) => {
  console.log("STRIPE Get user cards: ", user)
  const user_req = await stripe.paymentMethods.list({ customer: user, type: 'card' });
  return user_req;
}

exports.createCard = async (user, address, card) => {
  console.log("STRIPE Create card: ", card.cvc)
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

exports.attachUser = async (card, user) => {
  const card_req = await stripe.paymentMethods.attach(card, {customer: user});
  return card_req;
}

exports.confirmPayment = async (ammount, card, customer) => {
  console.log("STRIPE Confirm payment: ", card)
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
