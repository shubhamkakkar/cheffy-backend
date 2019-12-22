'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/user-controler');
const messageController = require('../controlers/message-controller');
const basketController = require('../controlers/basket-controler');
const authService = require("../services/auth");
const facebookRouter = require("../routes/facebook");
const creditCardRouter = require("../routes/card");
const multerStart = require(path.resolve("config/multer"));

const udpateFields = [
  'profile_photo',
];

const fieldsFile = udpateFields.map((field) => {
  return {name: field, maxCount: 1};
});

router.get('/dummy', controller.dummy);

router.get('/', authService.authorize, controller.getUser);
router.post('/', controller.create);
router.post('/login', controller.authenticate);
router.post('/logout', authService.authorize, controller.logout);

router.put('/location', authService.authorize, controller.getAuthUserMiddleware, controller.updateLocation);

router.post('/socialauth', controller.socialauth);
router.post('/socialauth/register', controller.socialauthRegister);

router.get('/balance', authService.authorize, controller.getUserBalance);
router.get('/balance/history?:from:to', authService.authorize, controller.getUserBalanceHistory);
router.post('/verifyphone', authService.authorize, controller.verifyPhone);
router.post('/confirmphone', authService.authorize, controller.checkPhone);
router.post('/verify-email-token', controller.verifyEmailToken);
router.post('/complete-registration', controller.completeRegistration);
router.post('/resend-emailtoken', controller.resendEmailToken);

router.post('/verifypassword', authService.authorize, controller.verifyChangePassword);
router.post('/changepassword', controller.changePassword);
router.post('/confirmchangepassword', authService.authorize, controller.confirmChangePassword);
router.put('/edit', authService.authorize, controller.put);
router.post('/forgot-password', controller.forgotPassword);

router.put('/balance', authService.authorize, multerStart(fieldsFile),  controller.getUserBalance);
//router.put('/balance/history', authService.authorize, controller.getUserBalanceHistory);

//Facebook
router.use('/facebook',facebookRouter);

//Stripe
router.use('/card',creditCardRouter);

// Message module

router.get('/messages/users', messageController.list);
router.post('/messages/users/:to_userID', messageController.new);
router.get('/messages/users/:to_userID', messageController.messages);

//Search - food/restaurant
router.get('/search/:text',  controller.search);


router.get('/searchPredictions', controller.searchPredictions);

router.get('/peopleAlsoAdded/:id', basketController.peopleAlsoAddedList);


module.exports = router;
