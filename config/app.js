/**
* Application config here
*/
module.exports = {
  mail: {
    sendgrid: {
      host: process.env.SENDGRID_HOST,
      port: process.env.SENDGRID_PORT,
      user: process.env.SENDGRID_USER,
      pass: process.env.SENDGRID_PASS,
    }
  },
  phone: {
    twilio: {
      accountSid: proces.env.TWILIO_ACCOUNT_SID,
      authToken: proces.env.TWILIO_AUTH_TOKEN,
      baseNumber: proces.env.TWILIO_BASE_NUMBER
    }
  }
};
