const path = require('path');
const HttpStatus = require('http-status-codes');
const authService = require('../services/auth');
const paymentService = require('../services/payment');
const userRepository = require('../repository/user-repository');
const ValidationContract = require('../services/validator');
const asyncHandler = require('express-async-handler');
const userConstants = require(path.resolve('app/constants/users'));
const cardInputFilter = require(path.resolve('app/inputfilters/card'));

function createStripePaginateQuery(req) {
  const limit = req.query.pageSize || 10;
  const starting_after = req.query.page * limit || 0;
  return { limit, starting_after };
}

async function getcreditCardList(req) {
  if(!req.user.stripe_id){
    return res.status(HttpStatus.NOT_FOUND).send({message:"This user has no credit cards saved"});
  }

  const stripeQuery = createStripePaginateQuery(req);
  const creditCardList = await paymentService.getUserCardsList(req.user.stripe_id, stripeQuery);
  return creditCardList;
}

/**
* List user cards saved in stripe
*/

async function getcreditCardList(req) {
  if(!req.user.stripe_id){
    return res.status(HttpStatus.NOT_FOUND).send({message:"This user has no credit cards saved"});
  }

  const stripeQuery = createStripePaginateQuery(req);
  const creditCardList = await paymentService.getUserCardsList(req.user.stripe_id, stripeQuery);
  return creditCardList;
}

exports.getCustomer = asyncHandler(async (req, res) => {
  let customer = await paymentService.getUser(req.user.stripe_id);
  return res.status(HttpStatus.OK).send(customer);
})


exports.listUserCards = asyncHandler(async (req,res) => {

    //getAuthUserMiddleware handles user not found
    const user = req.user;
    //getAuthUserShippingAddress handles address not found
    const userShippingAddress = req.userShippingAddress;

    if(!user.stripe_id){
        return res.status(HttpStatus.NOT_FOUND).send({message:"This user has no credit cards saved"});
    }

    const stripeQuery = createStripePaginateQuery(req);
    const creditCardList = await paymentService.getUserCardsList(user.stripe_id, stripeQuery);

    res.status(HttpStatus.OK).send(creditCardList);

    /*if(err.raw.code === "incorrect_number"){
        return res.status(HttpStatus.CONFLICT).send({message:"The credit card number is incorrect"});
    }
    res.status(HttpStatus.CONFLICT).send(err);*/

});

/**
* Stripe add new customer and card
* If customer exists for user, only card will be added
*/
exports.addNewCard = asyncHandler(async (req, res) => {
    const contract = new ValidationContract();
    //getAuthUserMiddleware handles user not found
    let user = req.user;
    //getAuthUserShippingAddress handles address not found
    const userShippingAddress = req.userShippingAddress;

    contract.isRequired(req.body.number, 'Card Number is Required');
    contract.isRequired(req.body.exp_month, 'Card Expiry Month is Required');
    contract.isRequired(req.body.exp_year, 'Card Expiry Year is Required');
    contract.isRequired(req.body.cvc, 'Card cvc is Required');


    if (!contract.isValid()) {
        return res.status(HttpStatus.CONFLICT).send({message:"Review card info"});
    }

    if(user.verification_phone_status !== userConstants.STATUS_VERIFIED) {
      return res.status(HttpStatus.BAD_REQUEST).send({message:"User Phone Not Verified"});
    }

    if(user.verification_email_status !== userConstants.STATUS_VERIFIED) {
      return res.status(HttpStatus.BAD_REQUEST).send({message:"User Email Not Verified"});
    }

    let card = {
        number:req.body.number,
        exp_month:req.body.exp_month,
        exp_year:req.body.exp_year,
        cvc:req.body.cvc
    };

    if(!user.stripe_id) {
        let stripeNewUser = await paymentService.createUser(user, userShippingAddress);
        user = await userRepository.saveStripeinfo(user.id, stripeNewUser);
    }

    const stripeNewCard = await paymentService.createCard(user, userShippingAddress, card);
    const creditCardList = await getcreditCardList(req)
    if (creditCardList.data.some(method => method.card.fingerprint === stripeNewCard.card.fingerprint)) {
      return res.status(HttpStatus.BAD_REQUEST).send({message:"This card already exists for this user"});
    }
    const attachedCard = await paymentService.attachPaymentMethod(stripeNewCard.id, user.stripe_id);

    res.status(200).send({ message: "successfully created the card account!", status: HttpStatus.OK, data: attachedCard});

    /*if(err.raw.code === "incorrect_number"){
        return res.status(HttpStatus.CONFLICT).send({message:"The credit card number is incorrect"});
    }
    res.status(HttpStatus.CONFLICT).send(err);*/
});

/**
* Update Customer Stripe Info like default_source, shipping
* This middleware is used for Self update
*/
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  //getAuthUserMiddleware handles user not found
  let user = req.user;
  //getAuthUserShippingAddress handles address not found
  const userShippingAddress = req.userShippingAddress;

  const updates = cardInputFilter.stripeUpdateFilter.filter(req.body);

  const stripeResponse = await paymentService.updateUser(user, updates);

  res.status(200).send({ message: "successfully updated the card account!", status: HttpStatus.OK, data: stripeResponse});


});

exports.setAsDefaultCard = asyncHandler(async (req, res) => {
  //getAuthUserMiddleware handles user not found
  let user = req.user;

  const creditCardList = await getcreditCardList(req)
  if (!creditCardList.data.some(card => card.id === req.params.cardId)) {
    return res.status(HttpStatus.NOT_FOUND).send({message:"This card does not exists for this user"});
  }

  let updates = {
    invoice_settings: {default_payment_method: req.params.cardId}
  }
  const updatedUser = await paymentService.updateUser(user, updates);

  res.status(200).send({ message: "success!", status: HttpStatus.OK, data: updatedUser});

})


exports.deleteCard = asyncHandler(async (req, res) => {
  try{
    let deletedCard = await paymentService.detachPaymentMethod(req.params.cardId);

    return res.status(200).send({ message: "successfully deleted the card account!", status: HttpStatus.OK, data: deletedCard});

  }

  catch(e){
    return res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find your card for id", status: HttpStatus.CONFLICT});

  }
});

/**
* ADMIN
* Delete customer from stripe
*/
exports.deleteCustomer = asyncHandler(async(req, res, next) => {
  //admin user
  let adminUser = req.user;
  const paramUser = req.paramUser;

  const deleteResponse = paymentService.deleteUser(paramUser);

  res.status(HttpStatus.OK).send(deleteResponse);

});
/**
* ADMIN
* List all customers from stripe
* docs ref: https://stripe.com/docs/api/customers/list
*/
exports.listCustomers = asyncHandler(async(req, res, next) => {
  //admin user
  let user = req.user;
  const stripeQuery = createStripePaginateQuery(req);
  const data = paymentService.listUsers(stripeQuery);

  res.status(HttpStatus.OK).send(data);
});
