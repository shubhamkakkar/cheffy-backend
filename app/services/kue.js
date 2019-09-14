require('dotenv').config({  
  path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
})

var Queue = require('bull');

const queue = new Queue('DEFAULT', { redis: { port: 22839, host: 'ec2-3-222-186-102.compute-1.amazonaws.com', password: 'p9328cb971adc11b5d1bf1c9ad6c89b473880f5d9deb3cd5c425ce4153d2641e3'}});

let scheduleJob = data => {
  queue.add(data.jobName, data.params, { delay: data.time  - Date.now() });
};

module.exports = {
  scheduleJob
};
