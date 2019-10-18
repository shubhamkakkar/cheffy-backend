// require('dotenv').config({  
//   path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
// })

var Queue = require('bull');

const { REDIS_URL } = require('../../config/cache');

const queue = new Queue('MAIL', REDIS_URL);

const mailer = require('./mailer');

queue.process("sendEmail", async function(job, done) {
  let { data } = job;
  await mailer.sendMail(data);
  done();
});
