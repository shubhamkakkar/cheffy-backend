const userConstants = require(path.resolve("app/constants/users"));
const { OrderItem } = require("../../models/index");

exports.getFirstOrderItemByOrderId = async (orderId) => {
  try {
    let order_item = await OrderItem.findOne({
      where: { orderId: orderId },
      include: [
        {
          model: User,
          foreignKey: "chef_id",
          as: "chef",
          attributes: userConstants.userSelectFields,
        },
      ],
    });
    return order_item;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
