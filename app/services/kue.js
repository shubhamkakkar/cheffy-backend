// require('dotenv').config({  
//   path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
// })

var Queue = require('bull');

let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const queue = new Queue('DEFAULT', REDIS_URL);

let scheduleJob = data => {
  queue.add(data.jobName, data.params, { delay: data.time  - Date.now() });
};

module.exports = {
  scheduleJob
};
