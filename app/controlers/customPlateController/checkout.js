const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const Sequelize = require("sequelize");
const debug = require("debug")("custom-plate");
const ValidationContract = require("../../services/validator");
const repository = require("../../repository/customPlate-repository");
const repositoryOrderPayment = require("../../repository/orderPayment-repository");
const repositoryWallet = require("../../repository/wallet-repository");
const basketRepository = require("../../repository/basket-repository");
const repositoryOrder = require("../../repository/order-repository");
const repositoryOrderDelivery = require("../../repository/orderDelivery-repository");
const paymentService = require("../../services/payment");
const helpers = require("../controler-helper");
const { User, OrderFrequency } = require("../../models/index");
const TransactionsService = require("../../services/transactions");
const basketConstants = require(path.resolve("app/constants/baskets"));
const events = require(path.resolve("app/services/events"));
const appConstants = require(path.resolve("app/constants/app"));
const commission = require(path.resolve("config/driverCommision"));
const orderPaymentConstants = require(path.resolve(
  "app/constants/order-payment"
));
const orderConstants = require(path.resolve("app/constants/order"));
const orderDeliveryConstants = require(path.resolve(
  "app/constants/order-delivery"
));
const orderItemConstants = require(path.resolve("app/constants/order-item"));

const notificationConstant = require(path.resolve(
  "app/constants/notification"
));

const Op = Sequelize.Op;
const FCM = require("../../services/fcm");
const { PAYMENT_TYPE_COD } = require("../../constants/order-item");
const {
  dollarToCents,
  centsToDollar,
  orderPaymentErrorResponseBuilder,
  checkOutCashOnDelivery,
} = require("./checkoutHelper");

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
exports.checkOut = asyncHandler(async (req, res, next) => {
  const { promoCode, deliveryType, paymentType } = req.body;

  let contract = new ValidationContract();
  contract.isRequired(deliveryType, "delieveryType is required!");
  contract.isRequired(paymentType, "paymentType is required!");
  if (!contract.isValid()) {
    return res.status(HttpStatus.CONFLICT).send({ message: contract.errors() });
  }

  //user shipping address. if req.body.shipping_id || req.query.shipping_id is sent, it is that shipping address,
  //otherwise it is set to default user shipping address

  const deliveryTypes = [
    orderItemConstants.DELIVERY_TYPE_USER,
    orderItemConstants.DELIVERY_TYPE_CHEF,
    orderItemConstants.DELIVERY_TYPE_DRIVER,
  ];

  if (deliveryTypes.indexOf(deliveryType) === -1) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: `Delivery Type should be one of: ${deliveryTypes.join(",")}`,
      error: true,
    });
  }

  const paymentTypes = [
    orderItemConstants.PAYMENT_TYPE_COD,
    orderItemConstants.PAYMENT_TYPE_CARD,
  ];

  if (paymentTypes.indexOf(paymentType) === -1) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: `Payment Type should be one of: ${paymentTypes.join(",")}`,
      error: true,
    });
  }

  let existUser = req.user;
  const user_address = req.userShippingAddress;

  //get user basket items

  let user_basket = await basketRepository.getOneUserBasket(req.userId);
  if (!user_basket) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: `No basket`,
      error: true,
    });
  }

  let basket_content = await basketRepository.getBasketItemsDetail(
    user_basket.id
  );

  if (basket_content.length === 0) {
    return res
      .status(HttpStatus.CONFLICT)
      .send({ message: "Fail to get user shopping cart!", error: true });
  }

  let basketItems = basket_content;

  //check chef address available

  for (let elem of basketItems) {
    const basketType = elem.basket_type;

    let loc;

    if (basketType === basketConstants.BASKET_TYPE_PLATE) {
      if (!elem.plate) {
        continue;
      }

      loc = await repositoryOrder.userLocation(elem.plate.userId);
    }

    if (basketType === basketConstants.BASKET_TYPE_CUSTOM_PLATE) {
      if (!elem.custom_plate) {
        continue;
      }

      loc = await repositoryOrder.userLocation(elem.custom_plate.chefID);
    }

    if (!loc) {
      return res.status(HttpStatus.CONFLICT).send({
        message: "Chef location missing!",
        error: true,
      });
    }
  }

  let cart_items = [];

  for (let elem of basketItems) {
    const basketType = elem.basket_type;

    if (!elem[basketType]) continue;

    let element = {
      name: elem[basketType].name,
      description: elem[basketType].description,
      //amount to stripe should be sent in cents. also orderpayment table has amount in cents
      amount: dollarToCents(elem[basketType].price),
      currency: "usd",
      quantity: elem.quantity,
    };
    cart_items.push(element);
  }

  let userIds = [];

  for (let item of basketItems) {
    //some basket itme may custome_plate

    if (item.plate) {
      userIds.push(item.plate.userId);
    }
  }

  cart_items = await Promise.all(cart_items);
  let total_cart = cart_items.reduce(
    (prevVal, elem) => prevVal + parseFloat(elem.quantity * elem.amount),
    0
  );
  const shipping_fee = (commission.commissionValue / 100) * total_cart;
  total_cart += parseInt(shipping_fee);

  let payload = {
    shippingId: user_address.id,
    basketId: user_basket.id,
    userId: req.userId,
    total_items: basketItems.length,
    promoCode: promoCode,
    //convert back to dollar from cents for storing in order table
    order_total: centsToDollar(total_cart).toFixed(2),
    shipping_fee: centsToDollar(shipping_fee).toFixed(2),
  };

  events.publish(
    {
      action: appConstants.ACTION_TYPE_PRE_CHECKOUT,
      user: req.user,
      payload: { cart_items, payload },
      body: req.body,
      scope: appConstants.SCOPE_USER,
      type: "checkout",
    },
    req
  );

  let card_return, stripeCustomerResponse, confirm;
  //create order
  let create_order = await repositoryOrder.create(payload);

  if (req.body.paymentType === PAYMENT_TYPE_COD) {
    try {
      return await checkOutCashOnDelivery(
        req,
        res,
        create_order,
        basketItems,
        user_basket,
        userIds
      );
    } catch (err) {
      console.log({ err });
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: "something went wrong",
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  try {
    if (existUser.stripe_id) {
      stripeCustomerResponse = await paymentService.getUser(
        existUser.stripe_id
      );
    } else {
      stripeCustomerResponse = await paymentService.createUser(
        existUser,
        user_address
      );
      existUser = await User.findOne({ where: { id: req.userId } });
      existUser.stripe_id = stripeCustomerResponse.id;
      await existUser.save();
    }
  } catch (e) {
    const orderPaymentFail = orderPaymentErrorResponseBuilder({
      error: e,
      create_order,
      total_cart,
      req,
    });
    await repositoryOrderPayment.create(orderPaymentFail);
    await repositoryOrder.editState(
      create_order.id,
      orderConstants.STATE_TYPE_REJECTED
    );
    return res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem to create your payment data!",
      data: e,
      error: true,
    });
  }

  let cardAlreadyAttached = false;
  try {
    if (!req.body.card) {
      const cardList = await paymentService.getUserCardsList(
        existUser.stripe_id,
        { limit: 1 }
      );
      card_return = cardList.data[0];
      if (!card_return) {
        res.status(HttpStatus.NOT_FOUND).send({
          message:
            "User have no default card saved. Please send card information",
        });
      } else {
        cardAlreadyAttached = true;
      }
    } else {
      card_return = await paymentService.createCard(
        existUser,
        req.body.card,
        user_address
      );
    }
  } catch (e) {
    const orderPaymentFail = orderPaymentErrorResponseBuilder({
      error: e,
      create_order,
      total_cart,
      req,
    });
    await repositoryOrderPayment.create(orderPaymentFail);
    await repositoryOrder.editState(
      create_order.id,
      orderConstants.STATE_TYPE_REJECTED
    );

    return res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem to validate your card!",
      data: e,
      error: true,
    });
  }

  let user_card = card_return;
  if (!cardAlreadyAttached) {
    user_card = await paymentService.attachPaymentMethod(
      card_return.id,
      stripeCustomerResponse.id
    );
  }

  try {
    confirm = await paymentService.confirmPayment(
      total_cart,
      user_card.id,
      stripeCustomerResponse.id
    );
  } catch (e) {
    console.log("confirmPayment: ", e);
    await repository.editState(
      create_order.id,
      orderConstants.STATE_TYPE_REJECTED
    );
    return res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem to confirm your payment!",
      data: e,
      error: true,
    });
  }

  let data_full = await helpers.change_data(create_order.id, confirm);

  try {
    await repositoryWallet.getWallet(existUser.id);
  } catch (e) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem to get your Wallet!",
      data: e,
      error: true,
    });
  }

  const create_orderPayment = await repositoryOrderPayment.create(data_full);

  if (
    create_orderPayment.status === orderPaymentConstants.STATUS_SUCCEEDED &&
    create_orderPayment.type === "authorized"
  ) {
    await repositoryOrder.editState(
      create_order.id,
      orderConstants.STATE_TYPE_APPROVED
    );

    events.publish(
      {
        action: appConstants.ACTION_TYPE_PAYMENT_SUCCESS,
        user: req.user,
        payload: confirm,
        body: req.body,
        scope: appConstants.SCOPE_USER,
        type: "checkout",
      },
      req
    );

    events.publish(
      {
        action: appConstants.ACTION_TYPE_ORDER_APPROVED,
        user: req.user,
        order: create_order,
        body: req.body,
        payload: create_orderPayment,
        scope: appConstants.SCOPE_USER,
        type: "order",
      },
      req
    );

    let bulkTransactions = cart_items.map((elem) => ({
      identifier: "order_payment",
      userId: elem.chef_id,
      orderId: create_order.id,
      orderPaymentId: create_orderPayment.id,
      amount: elem.amount,
    }));

    let transactionsService = new TransactionsService();
    transactionsService.recordBulkCreditTransaction(bulkTransactions);

    //create order items and remove basket items
    const oderItemsPayload = basketItems.map(async (basketItem) => {
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
        note: basketItem.note,
      };

      let loc = {};

      if (basketType === basketConstants.BASKET_TYPE_PLATE) {
        loc = await repositoryOrder.userLocation(basketItem.plate.userId);
        orderItem.plate_id = basketItem.plate.id;
        orderItem.chef_id = basketItem.plate.userId;
      }

      if (basketType === basketConstants.BASKET_TYPE_CUSTOM_PLATE) {
        loc = await repositoryOrder.userLocation(
          basketItem.custom_plate.chefID
        );
        orderItem.customPlateId = basketItem.custom_plate.id;
        orderItem.chef_id = basketItem.custom_plate.chefID;
      }

      orderItem.chef_location = `${loc.addressLine1}, ${loc.addressLine2}, ${loc.city}-${loc.state} / ${loc.zipCode}`;
      return orderItem;
    });

    //create order items

    let myOrderList = await Promise.all(oderItemsPayload);

    const createdOrderItems = await repositoryOrder.createOrderItems(
      myOrderList
    );

    //remove basket items of a user

    await basketRepository.removeBasketItems(user_basket.id);

    //if not pickup by user create order deliveries
    if (deliveryType != orderItemConstants.DELIVERY_TYPE_DRIVER) {
      //create delivery for items which offers delivery
      const oderDeliveryPayload = basketItems
        .filter((basketItem) => {
          const basketType = basketItem.basket_type;
          if (basketItem[basketType].chefDeliveryAvailable) return true;
          return false;
        })
        .map((basketItem, index) => {
          const basketType = basketItem.basket_type;
          const orderDelivery = {
            orderItemId: createdOrderItems[index].id,
            order_delivery_type:
              orderDeliveryConstants.DELIVERY_TYPE_ORDER_ITEM,
            userId: req.userId,
            state_type: orderDeliveryConstants.STATE_TYPE_PENDING,
            delivery_type: deliveryType,
          };

          //set driverId from chef field of plate or custom_plate_order
          if (basketType === basketConstants.BASKET_TYPE_PLATE) {
            orderDelivery.driverId = basketItem.plate.userId;
          }

          if (basketType === basketConstants.BASKET_TYPE_CUSTOM_PLATE) {
            orderDelivery.driverId = basketItem.custom_plate.chefID;
          }
          return orderDelivery;
        });

      const orderDeliveries = await repositoryOrderDelivery.createOrderDeliveries(
        oderDeliveryPayload
      );
    }

    //orderFrquency count

    myOrderList = myOrderList.filter((elem) => elem.item_type == "plate");

    let frequencyList = [];

    if (myOrderList.length > 1) {
      for (let i = 0; i < myOrderList.length; i++) {
        for (let j = i + 1; j < myOrderList.length; j++) {
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
        where: {
          [Op.or]: [
            { plate1: obj.plate1, plate2: obj.plate2 },
            { plate1: obj.plate2, plate2: obj.plate1 },
          ],
        },
      });

      if (!existRecord) {
        await OrderFrequency.create(obj);
      } else {
        existRecord.frequency = existRecord.frequency + 1;
        existRecord.save();
      }
    });
    const users = await repository.getDeviceTokens(userIds.join());
    const deviceTokens = users
      .filter((user) => user.deviceToken)
      .map((user) => user.deviceToken);
    if (deviceTokens.length > 0) {
      const title = notificationConstant.ORDER_RECEIVED_TITLE;
      const body = notificationConstant.ORDER_RECEIVED_BODY;
      let pushnotification = {
        orderTitle: title,
        orderBrief: body,
        device_registration_tokens: deviceTokens,
        detail: users,
        orderId: create_order.id,
      };
      FCM(pushnotification);
    }
    return res.status(HttpStatus.OK).send({
      message: "Your order was successfully paid!",
      payment_return: create_orderPayment,
      //orderDeliveries: orderDeliveries
    });
  }

  events.publish(
    {
      action: appConstants.ACTION_TYPE_CHECKOUT_FAILED,
      user: req.user,
      body: req.body,
      payload: {
        order: create_order,
        cart_items,
        total_cart,
      },
      scope: appConstants.SCOPE_USER,
      type: "checkout",
    },
    req
  );

  return res.status(HttpStatus.CONFLICT).send({
    message: "There was a problem validating the data!",
    user_address: user_address,
    user_basket: user_basket,
    basket_content: basket_content,
    cart_items: cart_items,
    total_cart: total_cart,
    payload: payload,
    create_order: create_order,
  });
});
