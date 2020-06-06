const {
  OrderItem,
  User,
  Plates,
  CustomPlateOrder,
  CustomPlate,
  CustomPlateImage,
} = require("../../models/index");
const userConstants = require(path.resolve("app/constants/users"));

exports.getOrderItemByIdDetails = async (orderItemId) => {
  const orderItem = await OrderItem.findByPk(orderItemId, {
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
  return orderItem;
};
