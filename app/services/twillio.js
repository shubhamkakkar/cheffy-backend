const twilio = require('twilio');
const accountSid = 'AC04ca3ccd5af02c506cec68a869cfb54f';
const authToken = '4f3b450ee97d9e0e76705aad32ae78c8';
const baseNumber = '+15005550006';

exports.sendMessage = async (number, code) => {
  try {
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
  } catch (error) {
    return error;
  }
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
