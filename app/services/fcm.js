const path = require('path');
const fcmAPI = require(path.resolve('config/fcmSettings.json')).fcm;
const FCM = require('fcm-push');

/*For Notifications*/

module.exports = (data) => {

    let notificationData = data
    let fcm = new FCM(fcmAPI.serverKey);
    var message = {
        registration_ids: notificationData.device_registration_tokens, // Multiple tokens in an array
        collapse_key: 'your_collapse_key',

        notification: {
            title: notificationData.orderTitle,
            body: notificationData.orderBrief
        },

        data: {  //you can send only notification or only data(or include both)
            my_key: 'my value',
            my_another_key: 'my another value'
        }
    };

    return new Promise(function (resolve, reject) {
        fcm.send(message, function (err, response) {
            if (err) {
                console.log("Something has gone wrong!", err);
                reject(err);
            } else {
                console.log("Successfully sent with response: ", response);
                resolve(response);
            }
        });
    })
    /*promise style*/
    // fcm.send(message)
    //     .then(function (response) {
    //         console.log("FCM response: ", response)
    //         return response
    //     })
    //     .catch(function (err) {
    //         console.error('FCM error:' + err)
    //     });

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


