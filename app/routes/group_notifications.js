'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/groupNotification-controller');
const authService = require("../services/auth");


/***********************Notification to group of users 1 - 2 weeks old*******************/

router.get('/newUsers',controller.listNewUser);

/***********************Notification to group of New Driver/ Registration in previous 1-Month*******************/

router.get('/newDrivers',controller.listNewDrivers);


/***********************Notification to group of Old Driver/ Registration in greater than 1-Month*******************/

router.get('/oldDrivers',controller.listOldDrivers);

/***********************Notification to group of New Chef/ Registration in previous 1-Month*******************/

router.get('/newChef',controller.listNewChef);

/***********************Notification to group of Old Chef/ Registration in previous than 1-Month*******************/

router.get('/oldChef',controller.listOldChef);

/***********************Notification to group of Users/ Ordered First Time*******************/

router.get('/orderedOnce',controller.listFirstOrder);



module.exports =router