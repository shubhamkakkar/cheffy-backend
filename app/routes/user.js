'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controlers/user-controler');
const messageController = require('../controlers/message-controller');
const authService = require("../services/auth");
const facebookRouter = require("../routes/facebook");
const creditCardRouter = require("../routes/card");

router.get('/dummy', controller.dummy);
router.get('/dummy-categories', controller.dummyCategories);

router.get('/', authService.authorize, controller.getUser);
router.post('/', controller.create);
router.post('/login', controller.authenticate);
router.get('/getmodeltype', controller.getModelType);
router.get('/balance', authService.authorize, controller.getUserBalance);
router.get('/balance/history?:from:to', authService.authorize, controller.getUserBalanceHistory);
router.post('/verifyphone', authService.authorize, controller.verifyPhone);
router.post('/confirmphone', authService.authorize, controller.checkPhone);
router.post('/confirmemail', authService.authorize, controller.verifyEmailToken);
router.post('/resend-emailtoken', authService.authorize, controller.resendEmailToken);

router.post('/verifypassword', authService.authorize, controller.verifyChangePassword);
router.post('/confirmchangepassword', authService.authorize, controller.confirmChangePassword);
router.post('/changepassword', authService.authorize, controller.changePassword);
router.put('/edit', authService.authorize, controller.put);

router.put('/balance', authService.authorize, controller.getUserBalance);
//router.put('/balance/history', authService.authorize, controller.getUserBalanceHistory);

//Facebook
router.use('/facebook',facebookRouter);

//Stripe
router.use('/card',creditCardRouter);

// Message module

router.get('/messages/users', messageController.list);
router.post('/messages/users/:to_userID', messageController.new);
router.get('/messages/users/:to_userID', messageController.messages);
router.get('/messages/getmodeltype', messageController.getModelType);

module.exports = router;
