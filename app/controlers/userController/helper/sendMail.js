const mailer = require("../../../services/mailer");

/**
 * SendMail helper
 */
async function sendMail({ req, pass }) {
  let args = {
    to: req.body.email,
    from: "Cheffy contact@cheffy.com",
    replyTo: "contact@cheffy.com",
    subject: `Welcome to Cheffy!`,
    template: "forget/forgot",
    context: { token: pass, user: " One more step..." },
  };

  try {
    return await mailer.sendMail(args);
  } catch (err) {
    console.log({ err });
    return 0;
  }
}

module.exports = sendMail;
