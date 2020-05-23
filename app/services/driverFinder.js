const kue = require("../services/kue");
const NotificationServices = require("./notification");
const {User,DriverFinder, OrderDelivery} = require('../models/index')
const userRepository = require('../repository/user-repository')
const WAITING_TIME_FOR_ACCEPTANCE_INTERVAL=60*1000
const FAIL_TO_FIND_DRIVERS_JOB  = "failToFindDriver"

function DriverFinderService(){
    DriverFinderService.prototype.findBestMatch = (data) => {
        console.log(`One DriverFinderService was started.`)
        // find pickup location
        let pickupLat = data.pickupLocation.latitude;
        let pickupLong = data.pickupLocation.longitude;

        // find dropoff location
        let dropoffLat = data.dropoffLocation.latitude;
        let dropoffLong = data.dropoffLocation.longitude;
        
        console.log(`DemandService looking for drivers near from lat:${pickupLat} lng:${pickupLong}`)
        // find drivers in a area of 3 mi
        const driversMatched = userRepository.findDriversInsideArea(pickupLat,pickupLong, 25)
        console.log(`DemandService found these drivers ${driversMatched}`)
        // order the drivers list by proximity
        if(driversMatched && driversMatched.lenght > 0){
            for(i=0;i<driversMatched.lenght;i++){
                DriverFinder.create({
                    driver_id:driversMatched[i].id,
                    order_delivery_id:data.orderDeliveryId,
                    sequence:i
                })
            }
        }
        
        // send notification to driver and wait 60 seconds, case fail, and try another
        startWatchingOrderAcceptance(orderDeliveryId);

        // if no driver is found, ask the DemandsService to retry
    }
    
    function startWatchingOrderAcceptance(orderDeliveryId) {
        const orderDelivery = OrderDelivery.findByPk(orderDeliveryId);
        console.log(`DemandService looking for one driver to deliver the order: ${orderDeliveryId}`)
        if(orderDelivery){
            if(orderDelivery.driverId){
                if(orderDelivery.driverId != null){
                    return true;
                }
            } 
        }
        
        // Look for our list of available drivers
        const driverFinderList = DriverFinder.findAll({
            where: {
                order_delivery_id: orderDeliveryId
          }});

        // if we still have some
        if(driverFinderList){
            if(driverFinderList.lenght == 1){
                // remove the first of this list
                let driverid = driverFinderList[0].id;
                
                DriverFinder.findAll({
                    where: {
                        driver_id: driverid,
                        order_delivery_id: orderDeliveryId
                    }
                }).then(driverFinder => {
                    return driverFinder.destroy();
                  })
                  
                console.log(`DemandService did not find a driver. Im removing this driver ${driverid} from the list`)
                // notify Demand Service we couldn'f find a Driver
                DriverFinderService.notifyDriverNotFound(orderDeliveryId);
            }else if(driverFinderList.lenght > 1){
                // remove the first of this list
                console.log(`DemandService did not find a driver. Im removing this driver ${driverid} from the list and find another`)
                DriverFinder.destroy({ DriverFinder: { id: driverFinderList[0].id } });
                // reschedule the watch
                let driverid = driverFinderList[0].id;
                NotificationServices.sendPushNotificationToUser(driverid,{type:"you_got_new_delivery"})
                console.log(`DemandService lets reschedule the watch for 60 sec`)
                setTimeout(startWatchingOrderAcceptance(orderDeliveryId,WAITING_TIME_FOR_ACCEPTANCE_INTERVAL));
            }else{
                // notify Demand Service we couldn'f find a Driver
                    console.log(`DemandService did not find a driver and there are no other options. Lets inform the DriverFinderService about it`)
                DriverFinderService.notifyDriverNotFound(orderDeliveryId);
            }
        }

        return false;
    }

    DriverFinderService.prototype.notifyDriverNotFound = (orderDeliveryId) => {

          let args = {
              jobName: FAIL_TO_FIND_DRIVERS_JOB,
              time: 1000,
              params: {
                orderDeliveryId: orderDeliveryId
              }
            };
      
          kue.scheduleJob(args);
          console.log(`DemandService sending a message to the Demand Service`)            
          return createdDrderDelivery;
    }


    DriverFinderService.prototype.stopLookingForDrivers = (orderDeliveryId) => {

        console.log(`DemandService found a driver`)            
        return createdDrderDelivery;
  }    
}

module.exports = DriverFinderService;