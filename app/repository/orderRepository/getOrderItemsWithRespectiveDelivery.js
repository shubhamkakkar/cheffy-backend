const path = require("path");
const {
  OrderItem,
  OrderDelivery,
  Plates,
  PlateImage,
  CustomPlateOrder,
  CustomPlate,
  CustomPlateImage,
} = require("../../models/index");
const orderItemConstants = require(path.resolve("app/constants/order-item"));

/**
 * Main Table: OrderItems and OrderDeliveries
 * Get user OrderItems with OrderDelivery info if exists
 */
exports.getOrderItemsWithRespectiveDelivery = async ({
  user_id,
  state_type,
  pagination,
}) => {
  const whereQuery = { user_id };

  if (state_type) {
    whereQuery.state_type = state_type;
  }

  return OrderItem.findAll({
    where: whereQuery,
    ...pagination,
    attributes: orderItemConstants.selectFields,
    include: [
      {
        model: OrderDelivery,
        //left outer join with OrderDelivery
        //show all records of orderitem and existing orderdelivery of that orderitem of a particular user
        required: false,
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
