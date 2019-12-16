// require('dotenv').config({
//   path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
// })

const path = require('path');
const Queue = require('bull');

//const { REDIS_URL } = require('../../config/cache');
const dbConfig = require(path.resolve('config/database'));

const redisConfig = {redis: dbConfig.redis};

const queue = new Queue('MAIL', redisConfig);

const mailer = require('./mailer');

queue.process("sendEmail", async function(job, done) {
  let { data } = job;
  await mailer.sendMail(data);
  done();
});
