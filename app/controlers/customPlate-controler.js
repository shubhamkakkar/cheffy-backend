'use strict';
const path = require('path');
const HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const repository = require("../repository/customPlate-repository");
const repositoryOrderPayment = require("../repository/orderPayment-repository");
const repositoryWallet = require("../repository/wallet-repository");
const repositoryShip = require("../repository/shipping-repository");
const basketRepository = require('../repository/basket-repository');
const repositoryOrder = require("../repository/order-repository");
const repositoryOrderDelivery = require("../repository/orderDelivery-repository");
const authService = require('../services/auth');
const paymentService = require("../services/payment");
const helpers = require('./controler-helper');
const { User, CustomPlate, CustomPlateOrder, OrderFrequency } = require('../models/index');
const TransactionsService = require("../services/transactions");
const asyncHandler = require('express-async-handler');
const customPlateInputFilter = require(path.resolve('app/inputfilters/custom-plate'));
const userConstants = require(path.resolve('app/constants/users'));
const paginator = require(path.resolve('app/services/paginator'));
const basketConstants = require(path.resolve('app/constants/baskets'));
const customPlateConstants = require(path.resolve('app/constants/custom-plates'));
const debug = require('debug')('custom-plate');

const events = require(path.resolve('app/services/events'));
const appConstants = require(path.resolve('app/constants/app'));

const orderPaymentConstants = require(path.resolve('app/constants/order-payment'));
const orderConstants = require(path.resolve('app/constants/order'));
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));
const orderItemConstants = require(path.resolve('app/constants/order-item'));
const Sequelize = require("sequelize");
const Op = Sequelize.Op;



/**
* Helper method
* add one day for closing date of the custom plate auction.
*/
function addDays() {
  var result = new Date();
  result.setDate(result.getDate() + 1);
  return result;
}

function dollarToCents(dollar) {
  return dollar * 100;
}

function centsToDollar(cents) {
  return cents/100;
}

function orderPaymentErrorResponseBuilder({error, create_order, total_cart, req}) {

  let orderPayment = {
    orderId: create_order.id,
    payment_id: null,
    amount: total_cart,
    client_secret: null,
    customer: error.raw && error.raw.requestId,
    payment_method: null,
    status: error.raw.code,
    receipt_url: null,
    card_brand: null,
    card_country: null,
    card_exp_month: null,
    card_exp_year: null,
    card_fingerprint: null,
    card_last: null,
    network_status: null,
    risk_level: null,
    risk_score: null,
    seller_message: error.raw.message,
    type: error.raw.type,
    paid: false,
  }
  return orderPayment;
}

exports.customPlateByIdMiddleware = asyncHandler(async(req, res, next, customPlateId) => {
  const customPlate = await repository.getCustomPlate(customPlateId);
  if(!customPlate) return res.status(HttpStatus.NOT_FOUND).send({message: `Custom Plate Not Found by id ${customPlateId}`});
  req.customPlate = customPlate;
  next();
});


exports.customPlateImageByIdMiddleware = asyncHandler(async(req, res, next, customPlateImageId) => {
  const customPlateImage = await repository.getCustomPlateImage(customPlateImageId);
  if(!customPlateImage) return res.status(HttpStatus.NOT_FOUND).send({message: `Custom Plate Image Not Found by id ${customPlateImageId}`});
  req.customPlateImage = customPlateImage;
  next();
});

/**
* Method: POST
* Add Custom plate by 'user' role type
*/
exports.addCustomPlate = asyncHandler(async (req, res, next) => {
  debug('req.body', req.body);
  let contract = new ValidationContract();
  contract.hasMinLen(req.body.name, 3, 'The plate name should have more than 3 caracteres');
  contract.isRequired(req.body.description, 'Plate description is required!');
  contract.isRequired(req.body.price_min, 'Minimum price is required!');
  contract.isRequired(req.body.price_max  , 'The maximum price is required!');
  contract.isRequired(req.body.quantity, 'The amount of plates is obligatory!');
  //contract.isRequired(req.body.chef_location_radius, 'The amount of plates is obligatory!');

  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    return 0;
  }

  const user = req.user;

  if(user.user_type !== userConstants.USER_TYPE_USER) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: `Only 'user' role can create custom plate.`, status: HttpStatus.BAD_REQUEST});
  }

  let data_received = customPlateInputFilter.filter(req.body, 'form-data');
  let images, images_create;

  data_received.userId = user.id;
  data_received.close_date = addDays();

  if (data_received.images) {
    images = data_received.images;
    delete data_received.images;
  }

  const customPlate = await repository.create(data_received);

  if(req.files && req.files['custom_plate_image']) {
    //images = req.files['profile_photo'][0].key;
    images = req.files['custom_plate_image'];
  }

  if (images) {
    let images_data = [];
    images.forEach(elem => {
      elem.customPlateId = customPlate.id;
      elem.name = customPlate.name;
      elem.url = elem.url;
      images_data.push(elem);
    });

    images_create = await repository.createPlateImage(images_data)
  }

  //create auction for the plate
  const auction = await repository.createAuction({customPlateId: customPlate.id, userId: user.id});

  const payload = {};
  payload.status = HttpStatus.CREATED;
  //should we name the property plate or custom plate
  payload.customPlate = customPlate;
  payload.auction = auction;
  payload.images = images_create;
  debug('res payload', payload);
  res.status(HttpStatus.CREATED).send({
    message: "The custom plate was successfully added!",
    data: payload
  });

  //publish create action
  events.publish({
      action: appConstants.ACTION_TYPE_CREATED,
      user: req.user,
      cutomPlate: customPlate,
      payload: payload,
      scope: appConstants.SCOPE_USER,
      type: 'customPlate'
  }, req);

});

/**
* Edit Custom Plate
* Don't allow to edit if auction is closed
*/
exports.editCustomPlate = [
  asyncHandler(async(req, res, next) => {
    const customPlateAuction = await repository.getCustomPlateAuctionByCustomPlate(req.customPlate.id);

    if(!customPlateAuction) {
      return res.status(HttpStatus.BAD_REQUEST).send({message: 'The auction for this is already removed! Contact Support'});
    }

    if(customPlateAuction.state_type === customPlateConstants.STATE_TYPE_CLOSED) {
      return res.status(HttpStatus.BAD_REQUEST).send({message: 'The auction is already closed.'});
    }
    next();

  }),
  asyncHandler(async (req, res, next) => {
    debug('req.body', req.body);
    let contract = new ValidationContract();

    if (!contract.isValid()) {
      res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
      return 0;
    }

    const user = req.user;

    if(user.user_type !== userConstants.USER_TYPE_USER) {
      return res.status(HttpStatus.BAD_REQUEST).send({message: `Only 'user' role can create custom plate.`, status: HttpStatus.BAD_REQUEST});
    }

    let data_received = customPlateInputFilter.filter(req.body, 'form-data');
    let images, images_create;

    if (data_received.images) {
      images = data_received.images;
      delete data_received.images;
    }

    //const customPlate = await repository.create(data_received);
    const customPlate = await req.customPlate.update(data_received);

    if(req.files && req.files['custom_plate_image']) {
      //images = req.files['profile_photo'][0].key;
      images = req.files['custom_plate_image'];
    }

    if (images) {
      let images_data = [];
      images.forEach(elem => {
        elem.customPlateId = customPlate.id;
        elem.name = customPlate.name;
        elem.url = elem.url;
        images_data.push(elem);
      });

      images_create = await repository.createPlateImage(images_data)
    }

    //create auction for the plate
    const auction = await repository.getCustomPlateAuctionByCustomPlate(customPlate.id);

    const payload = {};
    payload.status = HttpStatus.CREATED;
    //should we name the property plate or custom plate
    payload.customPlate = customPlate;
    payload.auction = auction;
    payload.images = images_create;
    debug('res payload', payload);
    res.status(HttpStatus.CREATED).send({
      message: "The custom plate was successfully updated!",
      data: payload
    });

    //publish edit action
    events.publish({
        action: appConstants.ACTION_TYPE_UPDATED,
        user: req.user,
        cutomPlate: customPlate,
        payload: payload,
        scope: appConstants.SCOPE_USER,
        type: 'customPlate'
    }, req);

})];


exports.addImages = asyncHandler(async(req, res, next) => {
  const customPlate = req.customPlate;
  let images = null;
  if(req.files && req.files['custom_plate_image']) {
    images = req.files['custom_plate_image'];
  }

  if(!images) return res.status(HttpStatus.BAD_REQUEST).send({message: 'No images sent for upload'});

  let images_data = [];
  images.forEach(elem => {
    elem.customPlateId = customPlate.id;
    elem.name = customPlate.name;
    elem.url = elem.url;
    images_data.push(elem);
  });

  const createdImages = await repository.createPlateImage(images_data)

  res.status(HttpStatus.OK).send({message: 'Custom Plate images uploaded successfully.', images: createdImages});


  events.publish({
      action: appConstants.ACTION_TYPE_IMAGE_ADDED,
      user: req.user,
      cutomPlate: customPlate,
      payload: images_data,
      scope: appConstants.SCOPE_USER,
      type: 'customPlate'
  }, req);

});


exports.deleteImage = asyncHandler(async(req, res, next) => {
  const customPlateImage = req.customPlateImage;

  await customPlateImage.destroy();

  res.status(HttpStatus.OK).send({message: `Custom Plate Image by Id : ${customPlateImage.id} removed`})

  events.publish({
      action: appConstants.ACTION_TYPE_IMAGE_DELETED,
      user: req.user,
      cutomPlate: req.customPlate,
      payload: customPlateImage,
      scope: appConstants.SCOPE_USER,
      type: 'customPlate'
  }, req);

});

/**
* Method: POST
* Place custom bid by chef user for a custom plate
*/
exports.bidCustomPlate = asyncHandler(async (req, res, next) => {
  const authUser = req.user;
  debug('req body', req.body);
  if (authUser.user_type !== userConstants.USER_TYPE_CHEF) {
    return res.status(HttpStatus.CONFLICT).send({
      message: `Only 'chef' user can place a bid for a custom plate.`,
      error: true
    });
  }

  if (!req.body.auction) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to send auction(customPlateId)",
      status: HttpStatus.CONFLICT
    });
  }

  if (!req.body.price) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to give a price!",
      status: HttpStatus.CONFLICT
    });
  }

  if (!req.body.preparation_time) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to estimate a preparation time!",
      status: HttpStatus.CONFLICT
    });
  }

  if (!req.body.chefDeliveryAvailable) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to state whether you deliver or not!",
      status: HttpStatus.CONFLICT
    });
  }

  if (req.body.chefDeliveryAvailable && !req.body.delivery_time) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to state whether delivery time in minutes!",
      status: HttpStatus.CONFLICT
    });
  }

  let context = {
    CustomPlateAuctionID: req.body.auction,
    chefID: authUser.id,
    price: req.body.price,
    preparation_time: req.body.preparation_time,
    chefDeliveryAvailable: req.body.chefDeliveryAvailable,
    delivery_time: req.body.delivery_time
  };

  //check if auction is closed;
  const auction = await repository.getCustomPlateAuction(req.body.auction);

  if(!auction) {
    return res.status(HttpStatus.NOT_FOUND).send({message: 'Auction Not Found'});
  }

  //check auction closing date
  //TODO use moment library
  const customPlate = await repository.getCustomPlate(auction.customPlateId);
  if(new Date() >= customPlate.close_date) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: 'Auction Date Expired'});
  }

  if(auction.state_type === customPlateConstants.STATE_TYPE_CLOSED) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: 'Auction Already Closed'});
  }

  const data = await repository.bidCustomPlate(context);
  debug('bid data', data);
  res.status(HttpStatus.CREATED).send({
    message: "Your bid was registered!",
    data: data
  });

  events.publish({
      action: appConstants.ACTION_TYPE_CREATED,
      user: req.user,
      customPlate: customPlate,
      customPlateAuctionBid: data,
      payload: data,
      scope: appConstants.SCOPE_CHEF,
      type: 'customPlateAuctionBid'
  }, req);

});

/**
* Method: POST
* User accept auction bid for a chef
* CustomPlateOrder is created when user accepts auction bid
*/
exports.acceptCustomPlateBid = asyncHandler(async (req, res, next) => {
  //get bid document by id
  let customPlateAuctionBid = await repository.getCustomPlateBid(req.params.auctionBidId);

  if(!customPlateAuctionBid)  {
    return res.status(HttpStatus.NOT_FOUND).send({message: 'Bid Not Found'});
  }

  let customPlateAuction = await repository.getCustomPlateAuction(customPlateAuctionBid.auctionId);

  if(customPlateAuction.state_type === customPlateConstants.STATE_TYPE_CLOSED) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: 'Auction Already Closed'});
  }

  //check date
  if(new Date() >= customPlateAuctionBid.custom_plate.close_date) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: 'Auction Date Expired'});
  }

  const customPlateOrderPayload = {
    ...customPlateAuctionBid,
    customPlateId: customPlateAuctionBid.custom_plate.id,
    chefID: customPlateAuctionBid.chefID,
    chefDeliveryAvailable: customPlateAuctionBid.chefDeliveryAvailable,
    userId: req.userId
  };

  let custom_order = await repository.createCustomOrder(customPlateOrderPayload);

  let basket = await basketRepository.getOrCreateUserBasket(req.userId);

  let body = {
    quantity: customPlateAuctionBid.quantity,
    basket_type: basketConstants.BASKET_TYPE_CUSTOM_PLATE,
    basketId: basket[0].id,
    customPlateId: custom_order.id
  };

  debug('user basket', basket);
  basket = basket[0].get({plain: true});
  // basket = JSON.stringify(basket);
  // basket = JSON.parse(basket);
  // basket = basket[0];
  await basketRepository.createBasketItem(body);

  debug('user basket', basket);
  debug('custom order', custom_order);

  res.status(HttpStatus.CREATED).send({
    message: "Bid accepted, let's checkout now!",
    plate_data: custom_order,
    basket: basket
  });

  //close the auction and set winner
  await customPlateAuction.update({state_type: customPlateConstants.STATE_TYPE_CLOSED, winner: customPlateAuctionBid.userId});

  await repository.updateCustomPlateBidById({id: customPlateAuctionBid.id, data:{winner: true}});

  events.publish({
      action: appConstants.ACTION_TYPE_ACCEPTED,
      user: req.user,
      payload: {
        customPlate: customPlateAuctionBid.custom_plate,
        customOrder: custom_order,
      },
      customPlateAuctionBid: customPlateAuctionBid,
      scope: appConstants.SCOPE_USER,
      type: 'customPlateAuctionBid'
  }, req);

});

/**
* Method: POST
* Pay for custom plate, once the bid is accepted and the custom plate is in the basket items.
* This handles both plate and custom plate checkout
* payment is done through stripe
* transfer basket to order and basketItems to orderItems
* Process:
* Get User basket
* Get Basket Items
* Check if user BasketItems is empty. If empty send No Items Response
* Payment is done through stripe so check if user exists as customer in stripe
* If Customer User doesn't exist create one.
* Get User card from stripe if no card information is sent in request body
* Create New Card in Stripe and attach it to user in stripe if new card information is sent in request body
* Pay through card
* If Payment is successfull, Create Order and OrderPayment
* Create OrderItems
* Remove BasketItems
* Send Back Response
*/
exports.pay = asyncHandler(async (req, res, next) => {

  let existUser = req.user;

  //user shipping address. if req.body.shipping_id || req.query.shipping_id is sent, it is that shipping address,
  //otherwise it is set to default user shipping address
  const user_address = req.userShippingAddress;
  const deliveryTypes = [orderItemConstants.DELIVERY_TYPE_USER, orderItemConstants.DELIVERY_TYPE_CHEF, orderItemConstants.DELIVERY_TYPE_DRIVER];

  const promoCode = req.body.promoCode;
  const deliveryType = req.body.deliveryType;

  if(deliveryTypes.indexOf(deliveryType) === -1) {
    return res.status(HttpStatus.BAD_REQUEST).send({ message: `Delivery Type should be one of: ${deliveryTypes.join(',')}`, error: true });
  }

  //get user basket items
  let user_basket = await basketRepository.getOneUserBasket(req.userId);
  let basket_content = await basketRepository.getBasketItemsDetail(user_basket.id);
  if (basket_content.length === 0) {
    return res.status(HttpStatus.CONFLICT).send({ message: "Fail to get user shopping cart!", error: true });
  }

  let basketItems = basket_content;
  let cart_items = basketItems.map( async ( elem ) => {

    const basketType = elem.basket_type;

    let element = {
      name: elem[basketType].name,
      description: elem[basketType].description,
      //amount to stripe should be sent in cents. also orderpayment table has amount in cents
      amount: dollarToCents(elem[basketType].price),
      currency: 'usd',
      quantity: elem.quantity,
    }
    return element;

  });

  cart_items = await Promise.all(cart_items)
  let total_cart = cart_items.reduce( ( prevVal, elem ) => prevVal + parseFloat(elem.quantity * elem.amount), 0 );
  let payload = {
    shippingId: user_address.id,
    basketId: user_basket.id,
    userId: req.userId,
    total_items: basketItems.length,
    promoCode: promoCode,
    //convert back to dollar from cents for storing in order table
    order_total: centsToDollar(total_cart),
  };

  events.publish({
      action: appConstants.ACTION_TYPE_PRE_CHECKOUT,
      user: req.user,
      payload: {cart_items, payload},
      body: req.body,
      scope: appConstants.SCOPE_USER,
      type: 'checkout'
  }, req);

  let card_return, stripeCustomerResponse, confirm;
    //create order
  let create_order = await repositoryOrder.create(payload);

  try {
    if (existUser.stripe_id) {
      stripeCustomerResponse = await paymentService.getUser(existUser.stripe_id);
    } else {
      stripeCustomerResponse = await paymentService.createUser(existUser, user_address);
      existUser = await User.findOne({ where: { id: req.userId } });
      existUser.stripe_id = stripeCustomerResponse.id
      await existUser.save()
    }
  } catch (e) {
    const orderPaymentFail = orderPaymentErrorResponseBuilder({error: e, create_order, total_cart, req});
    await repositoryOrderPayment.create(orderPaymentFail);
    await repositoryOrder.editState(create_order.id, orderConstants.STATE_TYPE_REJECTED);
    return res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to create your payment data!',
      data: e,
      error: true
    });

  }

  let cardAlreadyAttached = false;
  try {
    if(!req.body.card) {
      const cardList = await paymentService.getUserCardsList(existUser.stripe_id, {limit: 1});
      card_return = cardList.data[0];
      if(!card_return) {
        res.status(HttpStatus.NOT_FOUND).send({message: 'User have no default card saved. Please send card information'});
      } else {
        cardAlreadyAttached = true;
      }
    } else {
      card_return = await paymentService.createCard(existUser, user_address, req.body.card);
    }

  } catch (e) {
    const orderPaymentFail = orderPaymentErrorResponseBuilder({error: e, create_order, total_cart, req});
    await repositoryOrderPayment.create(orderPaymentFail);
    await repositoryOrder.editState(create_order.id, orderConstants.STATE_TYPE_REJECTED)

    return res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to validate your card!',
      data: e,
      error: true
    });
  }

  let user_card = card_return;
  if(!cardAlreadyAttached) {
    user_card = await paymentService.attachPaymentMethod(card_return.id, stripeCustomerResponse.id);
  }

  try {
    confirm = await paymentService.confirmPayment(total_cart, user_card.id, stripeCustomerResponse.id);
  } catch (e) {
    console.log("confirmPayment: ", e)
    await repository.editState(create_order.id, orderConstants.STATE_TYPE_REJECTED)
    return res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to confirm your payment!',
      data: e,
      error: true
    });
  }

  let data_full = await helpers.change_data(create_order.id, confirm);

  try {
    await repositoryWallet.getWallet(existUser.id);
  } catch (e) {
    return res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to get your Wallet!',
      data: e,
      error: true
    });
  }

  const create_orderPayment = await repositoryOrderPayment.create(data_full);

  if (create_orderPayment.status === orderPaymentConstants.STATUS_SUCCEEDED && create_orderPayment.type === 'authorized') {
    await repositoryOrder.editState(create_order.id, orderConstants.STATE_TYPE_APPROVED)

    events.publish({
        action: appConstants.ACTION_TYPE_PAYMENT_SUCCESS,
        user: req.user,
        payload: confirm,
        body: req.body,
        scope: appConstants.SCOPE_USER,
        type: 'checkout'
    }, req);

    events.publish({
        action: appConstants.ACTION_TYPE_ORDER_APPROVED,
        user: req.user,
        order: create_order,
        body: req.body,
        payload: create_orderPayment,
        scope: appConstants.SCOPE_USER,
        type: 'order'
    }, req);


    let bulkTransactions = cart_items.map(elem => (
      {
        identifier:'order_payment',
        userId:elem.chef_id,
        orderId:create_order.id,
        orderPaymentId:create_orderPayment.id,
        amount:elem.amount
      }
    ));

    let transactionsService = new TransactionsService();
    transactionsService.recordBulkCreditTransaction(bulkTransactions)

    //create order items and remove basket items
    const oderItemsPayload = basketItems.map( async (basketItem) => {
      const basketType = basketItem.basket_type;
      const orderItem = {
        orderId: create_order.id,
        item_type: basketItem.basket_type,
        user_id: req.userId,
        deliveryType: req.body.deliveryType,
        //chef_location: DataTypes.STRING,
        name: basketItem[basketType].name,
        description: basketItem[basketType].description,
        amount: basketItem[basketType].price,
        quantity: basketItem.quantity,
        note: basketItem.note
      };

      let loc = {};

      if(basketType === basketConstants.BASKET_TYPE_PLATE) {
        loc = await repositoryOrder.userLocation(basketItem.plate.userId);
        orderItem.plate_id = basketItem.plate.id;
        orderItem.chef_id = basketItem.plate.userId;
      }

      if(basketType === basketConstants.BASKET_TYPE_CUSTOM_PLATE) {
        loc = await repositoryOrder.userLocation(basketItem.custom_plate.chefID);
        orderItem.customPlateId = basketItem.custom_plate.id;
        orderItem.chef_id = basketItem.custom_plate.chefID;
      }

      orderItem.chef_location = `${loc.addressLine1}, ${loc.addressLine2}, ${loc.city}-${loc.state} / ${loc.zipCode}`;
      return orderItem;

    })

    //create order items
    let myOrderList = await Promise.all(oderItemsPayload);

    const createdOrderItems = await repositoryOrder.createOrderItems(myOrderList);

    //remove basket items of a user

    await basketRepository.removeBasketItems(user_basket.id);

    //if not pickup by user create order deliveries
    if(deliveryType != orderItemConstants.DELIVERY_TYPE_DRIVER) {
      //create delivery for items which offers delivery
      const oderDeliveryPayload = basketItems.filter((basketItem) => {
        const basketType = basketItem.basket_type;
        if(basketItem[basketType].chefDeliveryAvailable) return true;
        return false;
      }).map( (basketItem, index) => {
        const basketType = basketItem.basket_type;
        const orderDelivery = {
          orderItemId: createdOrderItems[index].id,
          order_delivery_type: orderDeliveryConstants.DELIVERY_TYPE_ORDER_ITEM,
          userId: req.userId,
          state_type: orderDeliveryConstants.STATE_TYPE_PENDING,
          delivery_type: deliveryType,
        };

        //set driverId from chef field of plate or custom_plate_order
        if(basketType === basketConstants.BASKET_TYPE_PLATE) {
          orderDelivery.driverId = basketItem.plate.userId;
        }

        if(basketType === basketConstants.BASKET_TYPE_CUSTOM_PLATE) {
          orderDelivery.driverId = basketItem.custom_plate.chefID;
        }
        return orderDelivery;

      });

      const orderDeliveries = await repositoryOrderDelivery.createOrderDeliveries(oderDeliveryPayload);
    }

    //orderFrquency count

    myOrderList = myOrderList.filter(elem => elem.item_type == "plate");


    let frequencyList = [];

    if(myOrderList.length > 1){

      for(let i=0;i<myOrderList.length;i++){

        for(let j=i+1;j<myOrderList.length;j++){
          let freq = {};

          freq.plate1 = myOrderList[i].plate_id;
          freq.plate2 = myOrderList[j].plate_id;
          freq.frequency = 1;

          frequencyList.push(freq);


        }


      }

    }

    frequencyList.map(async (obj) => {
      let existRecord = await OrderFrequency.findOne({

        where:{
        [Op.or]: [{plate1: obj.plate1, plate2: obj.plate2}, {plate1: obj.plate2, plate2: obj.plate1}]
        }
      })

      if(!existRecord){
        await OrderFrequency.create(obj);
      }
      else{
      existRecord.frequency = existRecord.frequency+1;
      existRecord.save();
    }

  });

    return res.status(HttpStatus.ACCEPTED).send({
      message: 'Your order was successfully paid!',
      payment_return: create_orderPayment,
      //orderDeliveries: orderDeliveries
    });
  }

  res.status(HttpStatus.CONFLICT).send({
    message: "There was a problem validating the data!",
    user_address: user_address,
    user_basket: user_basket,
    basket_content: basket_content,
    cart_items: cart_items,
    total_cart: total_cart,
    payload: payload,
    create_order: create_order
  });

  events.publish({
      action: appConstants.ACTION_TYPE_CHECKOUT_FAILED,
      user: req.user,
      body: req.body,
      payload: {
        order: create_order,
        cart_items,
        total_cart
      },
      scope: appConstants.SCOPE_USER,
      type: 'checkout'
  }, req);

});

/**
* Method: GET
* Get custom plate orders of a user.
*/
exports.listUserCustomOrders = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const query = { where: { userId }, ...paginator.paginateQuery(req)};
  const customPlateOrders = await CustomPlateOrder.findAll(query);
  res.status(HttpStatus.ACCEPTED).send({
    message: "Your custom order's",
    ...paginator.paginateInfo(query),
    data: customPlateOrders
  });

  events.publish({
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      payload: customPlateOrders,
      scope: appConstants.SCOPE_ALL,
      type: 'customPlateOrder'
  }, req);

});


/**
* Method: GET
* Get custom plates of a user.
* don't check for user roles as well. just show empty plates for driver, chef user type
* All user can see each other custom plates
*/
exports.listUserCustomPlates = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const query = { where: { userId }, ...paginator.paginateQuery(req)};
  const customPlates = await CustomPlate.findAll(query);
  res.status(HttpStatus.ACCEPTED).send({
    message: `Custom Plates of: ${req.paramUser.name}`,
    ...paginator.paginateInfo(query),
    data: customPlates
  });

  events.publish({
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      params: req.params,
      payload: customPlates,
      scope: appConstants.SCOPE_ALL,
      type: 'customPlate'
  }, req);

});
/**
* Method: GET
* Get custom plates of auth user.
*/
exports.listMyCustomPlates = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  const query = { userId, pagination: paginator.paginateQuery(req)};

  //const customPlates = await CustomPlate.findAll(query);
  const myCustomPlates = await repository.myCustomPlates(query)
  res.status(HttpStatus.ACCEPTED).send({
    message: "Your Custom Plates",
    ...paginator.paginateInfo(query),
    data: myCustomPlates
  });

  events.publish({
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      payload: myCustomPlates,
      scope: appConstants.SCOPE_USER,
      type: 'customPlate'
  }, req);
});

/**
* Method: GET
* Get custom plates of all users.
*/
exports.listAllCustomPlates = asyncHandler(async (req, res, next) => {
  const query = {...paginator.paginateQuery(req)};
  const customPlates = await CustomPlate.findAll(query);

  res.status(HttpStatus.ACCEPTED).send({
    message: "All custom plates from users.",
    ...paginator.paginateInfo(query),
    data: customPlates
  });

  events.publish({
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      payload: customPlates,
      scope: appConstants.SCOPE_USER,
      type: 'customPlate'
  }, req);

});

/**
* Custom Plates search/filter for Chef
* Get custom plates with all infos like auctions
* Filter by params
*/
exports.chefSearchCustomPlates = asyncHandler(async (req, res, next) => {
  const options = { req, query: req.query, pagination: paginator.paginateQuery(req)};

  const result = await repository.chefGetPlates(options);

  res.status(HttpStatus.ACCEPTED).send({
    data: result,
    ...paginator.paginateInfo(options.pagination)
  });

  events.publish({
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      query: req.query,
      payload: result,
      scope: appConstants.SCOPE_CHEF,
      type: 'customPlate'
  }, req);
});


/**
* Get one custom plate with all infos like auctions
*/
exports.customPlate = asyncHandler(async (req, res, next) => {
  const result = await repository.getPlate(req.params.customPlateId);
  if(!result) {
    return res.status(HttpStatus.NOT_FOUND).send({message: 'Custom Plate Not Found'});
  }

  res.status(HttpStatus.ACCEPTED).send(result);

  events.publish({
      action: appConstants.ACTION_TYPE_VIEWED,
      user: req.user,
      customPlate: result,
      scope: appConstants.SCOPE_ALL,
      type: 'customPlate'
  }, req);
});
