const repositoryOrderDelivery = require('../repository/orderDelivery-repository')
const DriverFinder = require('../services/driverFinder')
const SEND_DELIVERIES_JOB  = "sendDelivery"
const FAIL_TO_FIND_DRIVERS_JOB  = "failToFindDriver"

// Start Redis worker
var kue = require("kue");
var Queue = kue.createQueue({
  redis: {
    port: 6379,
    host: process.env.REDIS_HOST
  }
});
 
Queue.process(SEND_DELIVERIES_JOB, async function(job, done) {
  let { data } = job;
  console.log(`DemandService received a OrderDelivery to find driver ${data}`)
  const driverFinder = new DriverFinder();
  driverFinder.findBestMatch(data)
  done();
});

Queue.process(FAIL_TO_FIND_DRIVERS_JOB, async function(job, done) {
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