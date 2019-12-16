// require('dotenv').config({
//   path: process.env.NODE_ENV === "test" ? ".env.testing" : ".env"
// })
const path = require('path');
const Queue = require('bull');
const debug = require('debug')('kue');
//const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = require('../../config/cache');
const dbConfig = require(path.resolve('config/database'));

const redisConfig = {redis: dbConfig.redis};
debug('redis-config', redisConfig);
const queue = new Queue('DEFAULT', redisConfig);

let scheduleJob = data => {
  queue.add(data.jobName, data.params, { delay: data.time  - Date.now() });
};

module.exports = {
  scheduleJob
};
