// require('dotenv').config({  
//   path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
// })

var Queue = require('bull');

let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const queue = new Queue('MAIL', REDIS_URL);

const mailer = require('./mailer');

queue.process("sendEmail", async function(job, done) {
  let { data } = job;
  await mailer.sendMail(data);
  done();
});
