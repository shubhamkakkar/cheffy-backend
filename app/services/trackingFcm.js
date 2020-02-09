const path = require('path');
const fcmAPI = require(path.resolve('config/fcmSettings.json')).fcm;
const FCM = require('fcm-push');

/* For Live Tracking*/

module.exports.sendData = async (data) => {
    try{
        let fcm = new FCM(fcmAPI.serverKey);
        let message;
        message = {
            data:{
                body : data.body
            },
            device_id: data.device_id
        };

        console.log("++++++++message+++++")
        console.log(message)
        console.log("++++++++message+++++")
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
}
