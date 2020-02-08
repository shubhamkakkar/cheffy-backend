'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const {CustomPlate, CustomPlateImage,Favourites, sequelize,OrderItem, ShippingAddress,Review, Plates, User, Ingredient, PlateImage, KitchenImage, ReceiptImage, PlateCategory } = require('../models/index');
const userConstants = require(path.resolve('app/constants/users'));

/*********************************************************************************************************
 Android Team will hit this route internally after some intervals in order to get the current location
 and  update the same on database
 ************************************************************************************************************/

/*Tracking Driver Location*/

router.put('/:userId/driverTracking', async (req,res) =>{
    try{
        let userId  = req.params.userId
        let updatedCurrentLocation = {
            location_lat :req.body.location_lat,   /*Here lat refers to location of Driver*/
            location_lon :req.body.location_lon
        }
        await User.update(updatedCurrentLocation, {  // Updates the current location of driver
            where: {
                userId  : userId
            }
        })
        res.json({
            Code: '200',
            Message: 'Location Updated',
            data:{
                destinationLat :req.body.location_lat,
                destinationLon :req.body.location_lon
            }
        })
    }catch (e) {
        console.log(e)
        return res.json({
            code: '500',
            message: 'Server Error',
            status: 'error'
        })
    }
})

// Delivery By Chef/ tracking Chef Location

router.put('/:userId/chefTracking', async (req,res) =>{

    try{
        let userId  = req.params.userId
        let updatedCurrentLocation = {
            location_lat :req.body.location_lat,   /*Here lat refers to location of Chef*/
            location_lon :req.body.location_lon
        }

        await User.update(updatedCurrentLocation,{  // Updates the current Chef
            where: {
                userId  : userId
            }
        })
        res.json({
            Code: '200',
            Message: 'Location Updated',
            data:{
                location_lat :req.body.location_lat,
                location_lon :req.body.location_lon
            }
        })
    }catch (e) {
        console.log(e)
        return res.json({
            code: '500',
            message: 'Server Error',
            status: 'error'
        })
    }
})

// Pickup By user/ Tracking Customer Location

router.put('/:userId/customerTracking', async (req,res) =>{

    try{

        let userId  = req.params.userId
        let updatedCurrentLocation = {
            location_lat :req.body.location_lat,   /*Here lat refers to location of User/Customer*/
            location_lon :req.body.location_lon
        }
        await User.update(updatedCurrentLocation,{  // updates the current location of customer
            where: {
                userId  : userId
            }
        })
        res.json({
            Code: '200',
            Message: 'Location Updated',
            data:{
                location_lat :req.body.location_lat,
                location_lon :req.body.location_lon
            }
        })
    }catch (e) {
        console.log(e)
        return res.json({
            code: '500',
            message: 'Server Error',
            status: 'error'
        })
    }
})



module.exports = router;