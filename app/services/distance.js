const distance = require('google-distance-matrix');
const path = require('path');
const matrixKey = require(path.resolve('config/distance')).distance
distance.key (matrixKey.matrixKey) ;
distance.units('metric');
const asyncHandler = require('express-async-handler');

/*units= metric (default) returns distances in kilometers and meters.
units=imperial returns distances in miles and feet.*/



exports.getDistance = asyncHandler(async (origins, destinations, mode) => {

	try{

        /* Default mode is driving, if no mode selected driving will be set as default
        * we can use it as walking, train, bicycle*/

        distance.mode(mode);
        let resp = {};
        distance.matrix(origins, destinations, function (err, distances) {
        	if (err) {
        		return console.log(err);
        	}
        	if(!distances) {
        		return console.log('no distances');
        	}
        	if (distances.status == 'OK') {
        		for (let i=0; i < origins.length; i++) {
        			for (let j = 0; j < destinations.length; j++) {
        				let origin = distances.origin_addresses[i];
        				let destination = distances.destination_addresses[j];
        				if (distances.rows[0].elements[j].status == 'OK') {
        					let distance = distances.rows[i].elements[j].distance.text;
        					let time = distances.rows[i].elements[j].duration.text;
        					resp.distance = distance;
        					resp.time = time;
        					resp.Pickup_address = origin;
        					resp.Delivery_address = destination;
        					return resp;



        				} else {
        					return null;
        				}
        			}
        		}
        	}
        })
    }catch (e) {
    	console.log(e);
    	return null;
    }


});