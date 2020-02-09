'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();
const distance = require('google-distance-matrix');
const matrixKey = require(path.resolve('config/distance_matrixKey')).distance
distance.key (matrixKey.matrixKey) ;
distance.units('metric');

/*units= metric (default) returns distances in kilometers and meters.
    units=imperial returns distances in miles and feet.*/

router.post('/', async (req,res)=>{
    try{

        const isValid = (typeof req.body.origins === 'object' && typeof req.body.destinations === 'object');
        if (!isValid)return ("Invalid data!")
        let mode = req.body.mode!==undefined ? req.body.mode : req.body.mode = 'driving'

        /* Default mode is driving, if no mode selected driving will be set as default
        * we can use it as walking, train, bicycle*/

        const origins = req.body.origins
        const destinations = req.body.destinations
        distance.mode(mode);
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
                            let result = `Distance from ${origin} to ${destination} is ${distance}. Time Taken to Travel from Origin to Destination is ${time}`
                            res.json({
                                data:{
                                    distance:distance,
                                    time:time,
                                    mode:mode,
                                    pickup_latLng: origins,
                                    destination_latLng: destinations

                                },
                                Pickup_address:origin,
                                Delivery_address:destination,
                                message:result
                            })
                        } else {
                            res.json({
                                data:{
                                    message:destination + ' is not reachable by land from ' + origin
                                }

                            })
                        }
                    }
                }
            }
        })
    }catch (e) {
        res.status(500);
        res.json({
            error_code: 500,
            message: 'Internal Server Error',
            data: null
        });
    }
})

module.exports = router

