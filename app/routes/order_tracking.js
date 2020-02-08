'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const {CustomPlate, CustomPlateImage,Favourites, sequelize,OrderItem, ShippingAddress,Review, Plates, User, Ingredient, PlateImage, KitchenImage, ReceiptImage, PlateCategory } = require('../models/index');
const userConstants = require(path.resolve('app/constants/users'));
const FCM = require(path.resolve('app/services/trackingFcm'));


/*******************************************************************************
 * This route will be consumed(chef App) when user is coming to pickup by own
 * So chef will click the button from app to track person
 Pickup By User itself, tracking of users Starts*/

router.put('/:id/userTracking', async (req,res) =>{

    /*
        id  here refers to the id of Chef who received Food

         Here chef will track where user reached to pick his/her order

    */

    try{
        let chefLocationDetails = await User.findOne({

            where: {
                id: req.params.id,       // Id here refers to Chef who received ordered request
                user_type:userConstants.USER_TYPE_CHEF
            },
            attributes: ['location_lat','location_lon','device_id']
        })
        let chefLat = chefLocationDetails.location_lat    /*Here lat refers to location of customer user*/
        let chefLng = chefLocationDetails.location_lon    /*Here lng refers to location of customer user*/

        let chefLocation = chefLat + ',' + chefLng

        let userLocationDetails = await User.findOne({

            where: {
                id: req.body.userId,       // Id here refers to user
                user_type:userConstants.USER_TYPE_USER
            },
            attributes: ['location_lat','location_lon','device_id']
        })
        if(userLocationDetails) {


            let userLat = userLocationDetails.location_lat
            let userLng = userLocationDetails.location_lon

            let currentLocationOfUser = userLat + ',' + userLng // Current position of customer who is coming to pick up his/her food

            // Sending live location of User to Chef and android team will place these points on map to show current location

            let data = {
                body: {
                    currentLocation: currentLocationOfUser,
                    destinationLocation: chefLocation
                },

                device_id: [chefLocationDetails.device_id]
            }
            await FCM.sendData(data)
            res.json({
                code: '200',
                message: 'Success'
            })
        }else{
            res.json({
                code: '401',
                message: 'No Order Placed By This User'
            })
        }

    }catch (e) {
        console.log(e)
        return res.json({
            code: '500',
            message: 'Server Error',
            status: 'error'
        })
    }
})

/*******************************************************************************
 Pickup By User itself, tracking users Ends*/



/*******************************************************************************
 * This route will be consumed(user/customer App) when chef is coming to deliver by own
 * So user will click the button from app to track food
 Delivery By Chef itself*/

router.put('/:userId/chefTracking', async (req,res) =>{

    /*
        userId  here refers to the id of user who ordered Food

         Here user will track where chef reached to deliver food

    */

    try{
        let chefLocationDetails = await User.findOne({

            where: {
                id: req.body.id,       // Id here refers to Chef who received ordered request
                user_type:userConstants.USER_TYPE_CHEF
            },
            attributes: ['location_lat','location_lon','device_id']
        })
        if(chefLocationDetails) {

            let chefLat = chefLocationDetails.location_lat    /*Here lat refers to location of customer user*/
            let chefLng = chefLocationDetails.location_lon    /*Here lng refers to location of customer user*/

            let chefLocation = chefLat + ',' + chefLng

            let userDetails = await User.findOne({

                where: {
                    id: req.params.userId,       // Id here refers to user
                    user_type:userConstants.USER_TYPE_USER
                },
                attributes: ['location_lat','location_lon','device_id']
            })


            let userLat = userDetails.location_lat
            let userLng = userDetails.location_lon

            let userDestinationLocation = userLat + ',' + userLng // Current position of chef who is coming to deliver food

            // Sending live location of User to Chef and android team will place these points on map to show current location

            let data = {
                body: {
                    currentLocation: chefLocation,
                    destinationLocation: userDestinationLocation
                },

                device_id: [userDetails.device_id]
            }
            await FCM.sendData(data)
            res.json({
                code: '200',
                message: 'Success'
            })
        }else{
            res.json({
                code: '401',
                message: 'No Order Placed From This Chef'
            })
        }

    }catch (e) {
        console.log(e)
        return res.json({
            code: '500',
            message: 'Server Error',
            status: 'error'
        })
    }
})

/*******************************************************************************
 Delivery By Chef itself, tracking chef Ends*/



/*******************************************************************************
 * This route will be consumed(user/customer App) when driver is coming to deliver
 * So user will click the button from app to track food
 Delivery By Driver itself*/

router.put('/:id/driver', async (req,res) =>{

    /*
        id  here refers to the id of driver is coming to deliver order

         Here user will track where driver reached to deliver food

    */

    try{
        let driverDetails = await User.findOne({

            where: {
                id: req.params.id,
                user_type:userConstants.USER_TYPE_DRIVER
            },
            attributes: ['location_lat','location_lon','device_id']
        })
        if(driverDetails) {

            let driverLat = driverDetails.location_lat    /*Here lat refers to location of customer user*/
            let driverLon = driverDetails.location_lon    /*Here lng refers to location of customer user*/

            let driverLocation = driverLat + ',' + driverLon

            let userDetails = await User.findOne({

                where: {
                    id: req.body.userId,
                    user_type:userConstants.USER_TYPE_USER
                },
                attributes: ['location_lat','location_lon','device_id']
            })


            let userLat = userDetails.location_lat
            let userLng = userDetails.location_lon

            let userDestinationLocation = userLat + ',' + userLng // Current position of chef who is coming to deliver food

            // Sending live location of User to Chef and android team will place these points on map to show current location

            let data = {
                body: {
                    currentLocation: driverLocation,
                    destinationLocation: userDestinationLocation
                },

                device_id: [userDetails.device_id]
            }
            await FCM.sendData(data)
            res.json({
                code: '200',
                message: 'Success'
            })
        }else{
            res.json({
                code: '401',
                message: 'No Order Placed From This Chef'
            })
        }

    }catch (e) {
        console.log(e)
        return res.json({
            code: '500',
            message: 'Server Error',
            status: 'error'
        })
    }
})

/*******************************************************************************
 Delivery By Driver, tracking Ends*/

module.exports = router