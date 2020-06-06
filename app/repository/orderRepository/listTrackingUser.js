const {
  Order,
  OrderItem,
  OrderPayment,
  ShippingAddress,
  Plates,
  PlateImage,
  User,
  CustomPlateOrder,
  CustomPlate,
  OrderDelivery,
  CustomPlateImage,
} = require("../../models/index");

exports.listTrackingUser = async ({ userId, pagination, page, pageSize }) => {
  const response = await Order.findAll({
    where: { userId: userId },
    ...(page && pageSize && { ...pagination }),
    attributes: [
      "id",
      //   "basketId",
      //   "userId",
      //   "shippingId",
      "state_type",
      "promoCode",
      "total_items",
      "shipping_fee",
      "order_total",
      //   "createdAt",
      //   "updatedAt",
    ],
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: [
          "id",
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: ShippingAddress,
        attributes: [
          "id",
          "addressLine1",
          "addressLine2",
          "city",
          "state",
          "zipCode",
          "lat",
          "lon",
        ],
        as: "shipping",
      },
      {
        model: OrderItem,
        attributes: [
          "id",
          "plate_id",
          "item_type",
          //   "user_id",
          //   "chef_id",
          //   "chef_location",
          //   "name",
          //   "description",
          //   "amount",
          "quantity",
          "deliveryType",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            attributes: [
              "id",
              "name",
              "description",
              "price",
              "delivery_type",
              "chefDeliveryAvailable",
              "userId",
              "rating",
              "updatedAt",
              "createdAt",
              "delivery_time",
              "sell_count",
              "available",
            ],
            include: [
              {
                model: PlateImage,
                attributes: ["id", "url"],
              },
              {
                model: User,
                as: "chef",
                attributes: [
                  "id",
                  "name",
                  "email",
                  "restaurant_name",
                  "location_lat",
                  "location_lon",
                  "user_type",
                  "imagePath",
                ],
                // include: [
                //   {
                //     model: ShippingAddress,
                //     as: "address",
                //     attributes: [
                //       "id",
                //       "addressLine1",
                //       "addressLine2",
                //       "city",
                //       "state",
                //       "zipCode",
                //       "lat",
                //       "lon",
                //       "userId",
                //     ],
                //   },
                // ],
              },
            ],
          },
          {
            model: CustomPlateOrder,
            as: "custom_plate_order",
            attributes: [
              "id",
              "name",
              "description",
              "price",
              "delivery_type",
              "chefDeliveryAvailable",
              "userId",
              "rating",
              "updatedAt",
              "createdAt",
            ],
            include: [
              {
                model: CustomPlate,
                as: "custom_plate",
                include: [
                  {
                    model: CustomPlateImage,
                    attributes: ["id", "url"],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        model: OrderDelivery,
        as: "order_delivery",
        // required: true,
        // attributes: ["id", "state_type"],
      },
    ],
  });
  const order = JSON.parse(JSON.stringify(response));
  order.forEach((val, key) => {
    order.forEach((val, key) => {
      if (val.OrderItems.length > 0) {
        if (val && val.OrderItem && Object.keys(val.OrderItem).length > 0) {
          val.OrderItems.forEach((inVal, inKey) => {
            const orderItem = val.OrderItem;
            if (inVal.plate && inVal.plate.chef) {
              if (orderItem) {
                order[key].OrderItems[inKey].chef_name = delete order[key]
                  .OrderItem;
                inVal.plate.chef.name;
                order[key].plate = orderItem.plate;
              }
            }
          });
          // if (val.OrderItems.length > 0) {
          // 	val.OrderItems.forEach((inVal, inKey) => {
          // 		if (inVal.plate && inVal.plate.chef) {
          // 			order[key].OrderItems[inKey].chef_name =
          // 				inVal.plate.chef.name;
          // 		}
          // 	});
          // }
        }
      }
    });
  });
  return order;
};
