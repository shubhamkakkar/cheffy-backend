const repositoryOrderDelivery = require('../repository/orderDelivery-repository')
const DriverFinder = require('../services/driverFinder')
const SEND_DELIVERIES_JOB  = "sendDelivery"
const FAIL_TO_FIND_DRIVERS_JOB  = "failToFindDriver"

var kue = require('../services/kue');

var Queue = require('bull');

let REDIS_URL = 'redis://h:p9328cb971adc11b5d1bf1c9ad6c89b473880f5d9deb3cd5c425ce4153d2641e3@ec2-3-222-186-102.compute-1.amazonaws.com:22839';

const queue = new Queue('DEMAND', REDIS_URL);

queue.process('TEST_REDIS_QUEUE_AVAILABILITY', async function(job, done) {
  console.log('[REDIS] This is the availability test for REDIS');
  console.log('[REDIS] If you see this phrase multiple times everything for redis queue is fully operational.');
  done();
});

queue.add('TEST_REDIS_QUEUE_AVAILABILITY', {});

setTimeout(() => {
  queue.add('TEST_REDIS_QUEUE_AVAILABILITY', {});
}, 5000)

queue.process(SEND_DELIVERIES_JOB, async function(job, done) {
  let { data } = job;
  console.log(`DemandService received a OrderDelivery to find driver ${data}`)
  const driverFinder = new DriverFinder();
  driverFinder.findBestMatch(data)
  done();
});

queue.process(FAIL_TO_FIND_DRIVERS_JOB, async function(job, done) {
  let { data } = job;
  console.log(`DemandService receive a message of driver not found ${data}`)
  repositoryOrderDelivery.updateStatus(data.orderDeliveryId,'driver_not_found')
  done();
});



exports.sendToDelivery = async (orderDeliveryId, pickupLocation, dropoffLocation) => {

    let createdDrderDelivery = await repositoryOrderDelivery.findByPk(orderDeliveryId);

    let args = {
        jobName: SEND_DELIVERIES_JOB,
        time: 1000,
        params: {
          orderDeliveryId: createdDrderDelivery.id,
          orderId:orderId,
          pickupLocation: pickupLocation,
          dropoffLocation, dropoffLocation
        }
      };

    kue.scheduleJob(args);

    return createdDrderDelivery;
  }