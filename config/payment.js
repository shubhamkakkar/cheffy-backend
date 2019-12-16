'use strict';

/**
* Payment related config goes here
*/
module.exports = {
  stripe: {
    client_id: process.env.STRIPE_CLIENT_ID,
    client_secret: process.env.STRIPE_CLIENT_SECRET,
    success_url: process.env.STRIPE_SUCCESS_URL,
    cancel_url: process.env.STRIPE_CANCEL_URL,
  },
  paypal: {
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
    success_url: process.env.PAYPAL_SUCCESS_URL,
    cancel_url: process.env.PAYPAL_CANCEL_URL,
  }
};
