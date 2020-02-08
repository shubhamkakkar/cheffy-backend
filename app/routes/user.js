'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/user-controler');
const authController = require('../controlers/auth-controller');
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

//user signup flow
router.post('/', controller.create);
router.post('/complete-registration', multerStart(fieldsFile), controller.completeRegistration);
router.put('/edit', authService.authorize, multerStart(fieldsFile), controller.put);

router.get('/', authService.authorize, controller.getAuthUserMiddleware, controller.getUser);
router.put('/location', authService.authorize, controller.getAuthUserMiddleware, controller.updateLocation);
//auth routes
router.post('/login', authController.authenticate);
router.post('/logout', authService.authorize, authController.logout);
router.post('/socialauth', authController.socialauth);
router.post('/socialauth/register', authController.socialauthRegister);

// phone add and verify routes
router.post('/phone', authService.authorize, controller.getAuthUserMiddleware, controller.setUserPhone);
router.post('/verify-phone', authService.authorize, controller.getAuthUserMiddleware, controller.verifyUserPhone);

//email verification routes
router.post('/resend-email-token', controller.resendEmailToken);
router.post('/verify-email-token', controller.verifyEmailToken);

router.post('/change-password', authService.authorize, controller.getAuthUserMiddleware, controller.changePassword);

// forgot password routes
router.post('/forgot-password', controller.forgotPassword);
router.post('/verify-email-token-forgot-password', controller.veryifyTokenforgotPassword);
router.post('/reset-password', controller.resetPassword);

router.get('/balance/history/:from/:to', authService.authorize, controller.getAuthUserMiddleware, controller.getUserBalanceHistory);

//Facebook
router.use('/facebook',facebookRouter);

//Stripe
router.use('/card',creditCardRouter);

//balance
router.get('/chef/balance', authService.authorize, controller.getAuthUserMiddleware, controller.getChefBalance);
// router.get('/balance/history/?:from:to', authService.authorize, controller.getUserBalanceHistory);
router.get('/driver/balance', authService.authorize, controller.getAuthUserMiddleware, controller.getDriverBalance);

// Message module

router.get('/messages/users', messageController.list);
router.post('/messages/users/:to_userID', messageController.new);
router.get('/messages/users/:to_userID', messageController.messages);

//Search - food/restaurant
router.get('/search/:text',  controller.search);


router.get('/searchPredictions', controller.searchPredictions);

router.get('/peopleAlsoAdded/:id', basketController.peopleAlsoAddedList);

//Bank Accounts
/*router.get('/stripeDetails', authService.authorize, controller.getAuthUserMiddleware, controller.stripeDetails);
router.post('/bankAccount', authService.authorize, controller.getAuthUserMiddleware, controller.createBankAccount);
router.get('/bankAccount', authService.authorize, controller.getAuthUserMiddleware, controller.retrieveAllBankAccounts);
router.get('/bankAccount/:bankAccountId', authService.authorize, controller.getAuthUserMiddleware, controller.retrieveBankAccountById);
router.delete('/bankAccount/:bankAccountId', authService.authorize, controller.getAuthUserMiddleware, controller.deleteBankAccount);
router.post('/bankAccount/:bankAccountId/verify', authService.authorize, controller.getAuthUserMiddleware, controller.verifyBankAccount);*/


module.exports = router;
