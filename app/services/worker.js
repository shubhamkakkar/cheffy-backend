// require('dotenv').config({  
//   path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
// })

var Queue = require('bull');

let REDIS_URL = 'redis://h:p9328cb971adc11b5d1bf1c9ad6c89b473880f5d9deb3cd5c425ce4153d2641e3@ec2-3-222-186-102.compute-1.amazonaws.com:22839';

const queue = new Queue('MAIL', REDIS_URL);

const mailer = require('./mailer');

queue.process("sendEmail", async function(job, done) {
  let { data } = job;
  await mailer.sendMail(data);
  done();
});
