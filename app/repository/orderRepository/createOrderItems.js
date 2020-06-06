/**
 * TODO use bulk create in future
 * my bulk create implementation was not creating orderitems
 */

exports.createOrderItems = async (dataArray) => {
  //  return await OrderItem.bulkCreate(dataArray);
  const orderItems = dataArray.map(async (data) => {
    return await exports.createOrderItem(data);
  });

  return Promise.all(orderItems);
};
