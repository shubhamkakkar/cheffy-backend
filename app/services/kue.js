require('dotenv').config({  
  path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
})
var kue = require("kue");
var Queue = kue.createQueue({
  redis: {
    port: 6379,
    host: process.env.REDIS_HOST
  }
});

let scheduleJob = data => {
  Queue.createJob(data.jobName, data.params)
    .attempts(3)
    .delay(data.time - Date.now()) // relative to now.
    .save();
};

module.exports = {
  scheduleJob
};
