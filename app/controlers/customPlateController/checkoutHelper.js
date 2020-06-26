const path = require("path")
const HttpStatus = require("http-status-codes");
const events = require(path.resolve('app/services/events'));
const appConstants = require(path.resolve("app/constants/app"));
const basketConstants = require(path.resolve("app/constants/baskets"));
const orderItemConstants = require(path.resolve("app/constants/order-item"));
const repositoryOrder = require("../../repository/order-repository");
const basketRepository = require("../../repository/basket-repository");
const repositoryOrderDelivery = require("../../repository/orderDelivery-repository");
const repository = require("../../repository/customPlate-repository");

function dollarToCents(dollar) {
  return dollar * 100;
}

function centsToDollar(cents) {
  return cents / 100;
}

function orderPaymentErrorResponseBuilder({
  error,
  create_order,
  total_cart,
  req,
}) {
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
  };
  return orderPayment;
}

async function checkOutCashOnDelivery(
  req,
  res,
  create_order,
  basketItems,
  user_basket,
  userIds
) {
  const deliveryType = req.body.deliveryType;
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
      loc = await repositoryOrder.userLocation(basketItem.custom_plate.chefID);
      orderItem.customPlateId = basketItem.custom_plate.id;
      orderItem.chef_id = basketItem.custom_plate.chefID;
    }

    orderItem.chef_location = `${loc.addressLine1}, ${loc.addressLine2}, ${loc.city}-${loc.state} / ${loc.zipCode}`;
    return orderItem;
  });
  events.publish(
    {
      action: appConstants.ACTION_TYPE_ORDER_COD,
      user: req.user,
      payload: { cod: true },
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
      payload: { cod: true },
      scope: appConstants.SCOPE_USER,
      type: "order",
    },
    req
  );

  //create order items

  let myOrderList = await Promise.all(oderItemsPayload);

  const createdOrderItems = await repositoryOrder.createOrderItems(myOrderList);

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
          order_delivery_type: orderDeliveryConstants.DELIVERY_TYPE_ORDER_ITEM,
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
    };
    FCM(pushnotification);
  }
  return res.status(HttpStatus.OK).send({
    message: "Your order was successfully placed",
    payment_return: appConstants.ACTION_TYPE_ORDER_COD,
    payment_type: { cod: true },
    //orderDeliveries: orderDeliveries
  });
}

module.exports = {
  dollarToCents,
  centsToDollar,
  orderPaymentErrorResponseBuilder,
  checkOutCashOnDelivery,
};
