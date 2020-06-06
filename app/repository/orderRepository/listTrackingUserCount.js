const { Order } = require("../../models/index");

exports.listTrackingUserCount = async (userId) => {
  const response = await Order.count({
    where: { userId: userId },
  });
  return response;
};
