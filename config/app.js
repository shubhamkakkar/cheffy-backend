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
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      baseNumber: process.env.TWILIO_BASE_NUMBER
    }
  },
  slack: {
    userActivityWebhookURI: process.env.SLACK_USER_ACTIVITY_WEBHOOK_URI,
    bugWebhookURI: process.env.SLACK_BUG_WEBHOOK_URI,
    bugChannel:  process.env.SLACK_CHANNEL_BUG,
    userLogsChannel:  process.env.SLACK_CHANNEL_USER_ACTIVITY,
    username:  process.env.SLACK_USERNAME,
  }
};
