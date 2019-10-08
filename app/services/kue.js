// require('dotenv').config({  
//   path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
// })

var Queue = require('bull');

const { REDIS_URL } = require('../../config/cache');

const queue = new Queue('DEFAULT', REDIS_URL);

let scheduleJob = data => {
  queue.add(data.jobName, data.params, { delay: data.time  - Date.now() });
};

module.exports = {
  scheduleJob
};
