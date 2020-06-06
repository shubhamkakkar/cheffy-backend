const { Order } = require("../../models/index");

exports.listTrackingUserCount = async (userId) => {
  return await Order.count({
    where: { userId },
  });
};
