const {
  OrderItem,
  User,
  Plates,
  PlateImage,
  CustomPlateOrder,
  CustomPlate,
  CustomPlateImage,
} = require("../../models/index");
const path = require("path");
const userConstants = require(path.resolve("app/constants/users"));
const orderItemConstants = require(path.resolve("app/constants/order-item"));
/**
 * Main Table: OrderItems
 * Get chef orders
 * Chef user orders are in order items table instead of orders because a user can order from multiple chef,
 * so it's not necessary that a wole order can contain the same chef.
 */
exports.getChefOrders = async ({
  chef_id,
  state_type,
  pagination,
  page,
  pageSize,
}) => {
  const whereQuery = { chef_id };
  if (state_type) {
    whereQuery.state_type = state_type;
  }
  return OrderItem.findAll({
    where: whereQuery,
    ...(page && pageSize && { ...pagination }),
    attributes: orderItemConstants.selectFields,
    include: [
      {
        model: User,
        as: "user",
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
