const twilio = require('twilio');
const accountSid = 'AC8ce31b89ee3e1b7f9bc6152c89e8ae08';
const authToken = 'c342011d0a39aa6b35b25c29ffd33136';
const baseNumber = '+14172463332';

exports.sendMessage = async (number, code) => {
  const client = new twilio(accountSid, authToken);
  const response = await client.messages.create({
    body: `Your Cheffy verification code is: ${code}`,
    to: number,
    from: baseNumber
  });
  if (response.error_code == null && response.sid !== '') {
    return { message: "SMS sent successfully!", data: response, error: false };
  }
  return { message: "Failed to send SMS!", data: response, error: true };
};

exports.forgetPassMessage = async (number, code) => {
  const client = new twilio(accountSid, authToken);
  const response = await client.messages.create({
    body: `To update your password of Cheffy use the code: ${code}`,
    to: number,
    from: baseNumber
  });
  if (response.error_code == null && response.sid !== '') {
    return { message: "SMS sent successfully!", data: response, error: false };
  }
  return { message: "Failed to send SMS!", data: response, error: true };
};
