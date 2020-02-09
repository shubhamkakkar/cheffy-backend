const path = require('path');
const fcmAPI = require(path.resolve('config/fcmSettings.json')).fcm;
const FCM = require('fcm-push');

/*For Notifications*/

module.exports = async (data) => {
    try{
        let notificationData = data
        let fcm = new FCM(fcmAPI.serverKey);
        let message;
        message = {
            data:{
                title : notificationData.orderTitle,
                body : notificationData.orderBrief,
                sound : "default",
                click_action : notificationData.activity,
            },
            device_id: notificationData.device_id
        };
        /*promise style*/
        fcm.send(message)
            .then(function(response){
                console.log("FCM response: ", response)
                return response
            })
            .catch(function(err){
                console.error('FCM error:'+err)
            });
    }catch (e) {
        console.error(e)
    }
}


/* For Live Tracking*/

/*module.exports.sendData = async (data) => {

    console.log("----Data----")
    console.log(data)
    console.log("----Data----")
    try{
        let fcm = new FCM(fcmAPI.serverKey);
        let message;
        message = {
            data:{
                body : data.body
            },
            registration_ids: data.deviceId
        };
        //promise style
        fcm.send(message)
            .then(function(response){

                console.log("FCM response: ", response)
            })
            .catch(function(err){
                if (err !== "NotRegistered"){
                    console.error("FCM error: "+err)
                }
            });
    }catch (e) {
        console.log(e)
    }
}*/


