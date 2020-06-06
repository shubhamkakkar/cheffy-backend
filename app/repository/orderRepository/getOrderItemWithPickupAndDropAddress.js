const path = require("path");
const orderItemConstants = require(path.resolve("app/constants/order-item"));
const userConstants = require(path.resolve("app/constants/users"));

const {
  OrderItem,
  User,
  ShippingAddress,
  Order,
  Plates,
  PlateImage,
  CustomPlateOrder,
  CustomPlate,
  CustomPlateImage,
} = require("../../models/index");

exports.getOrderItemWithPickupAndDropAddress = async (orderItemId) => {
  return await OrderItem.findByPk(orderItemId, {
    attributes: orderItemConstants.selectFields,
    include: [
      {
        model: User,
        foreignKey: "user_id",
        as: "user",
        attributes: userConstants.userSelectFields,
      },
      {
        model: User,
        foreignKey: "chef_id",
        as: "chef",
        attributes: userConstants.userSelectFields,
        include: [{ model: ShippingAddress, as: "address" }],
      },
      {
        model: Order,
        foreignKey: "order_id",
        as: "order",
        include: [{ model: ShippingAddress, as: "shipping" }],
      },
      {
        model: Plates,
        as: "plate",
        include: [
          {
            model: PlateImage,
          },
        ],
      },
      {
        model: CustomPlateOrder,
        as: "custom_plate_order",
        include: [
          {
            model: CustomPlate,
            as: "custom_plate",
            include: [
              {
                model: CustomPlateImage,
              },
            ],
          },
        ],
      },
    ],
  });
};
