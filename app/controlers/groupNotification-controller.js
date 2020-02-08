'use strict';
const path = require('path');
const moment = require('moment')
const {CustomPlate, CustomPlateImage,Favourites, sequelize,OrderItem, ShippingAddress,Review, Plates, User, Ingredient, PlateImage, KitchenImage, ReceiptImage, PlateCategory } = require('../models/index');
const userConstants = require(path.resolve('app/constants/users'));
const FCM = require(path.resolve('app/services/fcm'))
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const asyncHandler = require('express-async-handler');

exports.listNewUser = asyncHandler(async (req,res)=>{

    try{
        let todayDate = moment().format('YYYY-MM-DD') + ' 00' + ':00' + ':00';

        let endDate = moment(todayDate).subtract("2", "week").format('YYYY-MM-DD') + " 23:59:59"

        console.log("Date Today", todayDate)
        console.log("Week 2", endDate)

        let newUsers = await User.findAll({

            where: {
                createdAt: {
                    [Op.between]: [endDate, todayDate]
                }
            },attributes:['device_id']
        })
        let device_id = []

        if (newUsers.length > 0 ) {

            newUsers.forEach(item => {
                device_id.push(item.device_id)

            })


            let groupNewUsers = {
                orderTitle: req.body.orderTitle, //  req.body.orderTitle
                orderBrief: req.body.orderBrief,  //req.body.orderBrief
                activity: 'Same Name as set from android app',     //req.body.activity
                device_id: device_id
            }

            let responseData =    await FCM(groupNewUsers)

            res.json({

                data:{
                    response:responseData
                }
            })
        }else{
            res.json({
                data:{
                    message:'No user Available'
                }
            })
        }
    }catch (e) {
        console.log(e)
    }
})

exports.listNewDrivers = asyncHandler(async (req,res)=> {


    try {
        let todayDate = moment().format('YYYY-MM-DD') + ' 00' + ':00' + ':00';
        let oneMonth = moment(todayDate).subtract("1", "months").format('YYYY-MM-DD') + " 23:59:59"

        console.log("One Month Is Here", oneMonth)

        let newDrivers = await User.findAll({

            where: {
                createdAt: {
                    [Op.gt]: oneMonth
                },
                user_type: userConstants.USER_TYPE_DRIVER

            },attributes:['device_id']
        })
        let device_id = []

        if (newDrivers.length > 0 ) {

            newDrivers.forEach(item => {
                device_id.push(item.device_id)

            })

            let groupNewDrivers = {
                orderTitle: req.body.orderTitle, //  req.body.orderTitle
                orderBrief: req.body.orderBrief,  //req.body.orderBrief
                activity: 'Same Name as set from android app',     //req.body.activity
                device_id: device_id
            }

            let responseData =    await FCM(groupNewDrivers)

            res.json({

                data:{
                    response:responseData
                }
            })
        }else{
            res.json({
                data:{
                    message:'No deviceId Available'
                }
            })
        }

    }catch (e) {
        console.log(e)

    }
})

exports.listOldDrivers = asyncHandler(async (req,res)=>{

    try {
        let todayDate = moment().format('YYYY-MM-DD') + ' 00' + ':00' + ':00';
        let oneMonth = moment(todayDate).subtract("1", "months").format('YYYY-MM-DD') + " 23:59:59"

        console.log("Month", oneMonth)

        let oldDrivers = await User.findAll({

            where: {
                createdAt: {
                    [Op.lt]: oneMonth
                },
                user_type: userConstants.USER_TYPE_DRIVER

            },attributes:['device_id']
        })
        let device_id = []

        if (oldDrivers.length > 0 ) {

            oldDrivers.forEach(item => {
                device_id.push(item.device_id)

            })

            let groupOldDrivers = {
                orderTitle: req.body.orderTitle, //  req.body.orderTitle
                orderBrief: req.body.orderBrief,  //req.body.orderBrief
                activity: 'Same Name as set from android app',     //req.body.activity
                device_id: device_id
            }

            let responseData =    await FCM (groupOldDrivers)

            res.json({

                data:{
                    response:responseData
                }
            })
        }else{
            res.json({
                data:{
                    message:'No deviceId Available'
                }
            })
        }

    }catch (e) {
        console.log(e)

    }
})

exports.listNewChef = asyncHandler(async (req,res)=>{

    try {
        let todayDate = moment().format('YYYY-MM-DD') + ' 00' + ':00' + ':00';
        let oneMonth = moment(todayDate).subtract("1", "months").format('YYYY-MM-DD') + " 23:59:59"

        console.log("One Month Is Here", oneMonth)

        let newChef = await User.findAll({

            where: {
                createdAt: {
                    [Op.gt]: oneMonth
                },
                user_type: userConstants.USER_TYPE_CHEF

            },attributes:['device_id']
        })
        let device_id = []

        if (newChef.length > 0 ) {

            newChef.forEach(item => {
                device_id.push(item.device_id)

            })

            let groupNewChef = {
                orderTitle: req.body.orderTitle, //  req.body.orderTitle
                orderBrief: req.body.orderBrief,  //req.body.orderBrief
                activity: 'Same Name as set from android app',     //req.body.activity
                device_id: device_id
            }

            let responseData =    await FCM(groupNewChef)

            res.json({

                data:{
                    response:responseData
                }
            })
        }else{
            res.json({
                data:{
                    message:'No deviceId Available'
                }
            })
        }

    }catch (e) {
        console.log(e)

    }
})

exports.listOldChef = asyncHandler(async (req,res)=>{
    try {
        let todayDate = moment().format('YYYY-MM-DD') + ' 00' + ':00' + ':00';
        let oneMonth = moment(todayDate).subtract("1", "months").format('YYYY-MM-DD') + " 23:59:59"

        console.log("Month", oneMonth)

        let oldChef = await User.findAll({

            where: {
                createdAt: {
                    [Op.lt]: oneMonth
                },
                user_type: userConstants.USER_TYPE_CHEF

            },attributes:['device_id']
        })
        let device_id = []

        if (oldChef.length > 0 ) {

            oldChef.forEach(item => {
                device_id.push(item.device_id)

            })

            let groupOldChef = {
                orderTitle: req.body.orderTitle, //  req.body.orderTitle
                orderBrief: req.body.orderBrief,  //req.body.orderBrief
                activity: 'Same Name as set from android app',     //req.body.activity
                device_id: device_id
            }

            let responseData =    await FCM (groupOldChef)

            res.json({

                data:{
                    response:responseData
                }
            })
        }else{
            res.json({
                data:{
                    message:'No deviceId Available'
                }
            })
        }

    }catch (e) {
        console.log(e)

    }
})

exports.listFirstOrder = asyncHandler(async (req,res)=>{

    try{
        let firstTimeUser = await User.findAll({

            where: {
                order_flag: {  /* Need to add this boolean field, order_flag: default value will be True. After order is done need to update this to false */
                    [Op.eq]: [true]
                }
            },attributes:['device_id']
        })

        let device_id = []

        if(firstTimeUser > 0){

            firstTimeUser.forEach(item => {
                device_id.push(item.device_id)
            })

            let firstOrderUsers = {
                orderTitle: req.body.orderTitle, //  req.body.orderTitle
                orderBrief: req.body.orderBrief,  //req.body.orderBrief
                activity: 'Same Name as set from android app',     //req.body.activity
                device_id: device_id
            }

            let responseData =    await FCM(firstOrderUsers)

            res.json({

                data:{
                    response:responseData
                }
            })

        }else{
            res.json({
                data:{
                    message:'No user Available'
                }
            })
        }

    }catch (e) {
        console.log(e)
    }

})
