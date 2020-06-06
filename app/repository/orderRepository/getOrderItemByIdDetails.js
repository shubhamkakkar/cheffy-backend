const path = require("path");

const {
  OrderItem,
  User,
  Plates,
  CustomPlateOrder,
  CustomPlate,
  CustomPlateImage,
  PlateImage,
} = require("../../models/index");
const userConstants = require(path.resolve("app/constants/users"));
const orderItemConstants = require(path.resolve("app/constants/order-item"));

exports.getOrderItemByIdDetails = async (orderItemId) => {
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
