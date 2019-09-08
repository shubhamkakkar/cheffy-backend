require('dotenv').config({  
  path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
})
// Start Redis worker
var kue = require("kue");
var Queue = kue.createQueue({
  redis: {
    port: 6379,
    host: process.env.REDIS_HOST
  }
});
const mailer = require('./mailer');

Queue.process("sendEmail", async function(job, done) {
  let { data } = job;
  await mailer.sendMail(data);
  done();
});
