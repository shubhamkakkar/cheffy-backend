const path = require("path");
const reviewConstants = require(path.resolve("app/constants/reviews"));
const { OrderItem, Review, AggregateReview } = require("../../models/index");
exports.createOrderReview = async (review) => {
  let orderItem, plate, createdReview;
  try {
    try {
      orderItem = await OrderItem.findByPk(review.orderItemId, {
        attributes: ["plate_id"],
      });
      if (!orderItem) {
        throw Error("Plate not found");
      }
    } catch (error) {
      throw error;
    }

    let plateId = orderItem.plate_id;
    review.plateId = plateId;

    createdReview = await Review.create(review);

    /*if(createdReview){
        let orderDelivery = OrderDelivery.findOne({where:{orderId:orderItem.orderId}});console.log(orderDelivery)
        if(orderDelivery){
          orderDelivery.rating = createdReview.rating;
          orderDelivery.has_rating = true;
          orderDelivery.save();
        }
      }*/

    let sumUser = await Review.count({
      where: { plateId: plateId },
    });

    let sumRating = await Review.sum("rating", {
      where: { plateId: plateId },
    });

    let aggr_item = {};
    aggr_item.review_type = reviewConstants.REVIEW_TYPE_PLATE;
    aggr_item.plateId = plateId;
    aggr_item.userCount = sumUser;
    aggr_item.rating = (sumRating / sumUser).toFixed(1);

    const foundPlate = await AggregateReview.findOne({
      where: { plateId: plateId },
    });
    if (!foundPlate) {
      await AggregateReview.create(aggr_item);
    } else
      await AggregateReview.update(aggr_item, {
        where: { plateId: plateId },
      });

    return await sequelize
      .query(
        `SELECT (sum(rating)/ count(rating)) as average_rating FROM Reviews where plateId=${plateId}`
      )
      .then(([results, metadata]) => {
        let average_rating = createdReview.rating;

        if (results.length > 0) {
          average_rating = results[0].average_rating;
        }

        try {
          return Plates.update(
            { rating: average_rating.toFixed(1) },
            { where: { id: plateId } }
          );
        } catch (error) {
          throw error;
        }
      })
      .then(function (retorno) {
        return createdReview;
      });
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to get Plate Reviews!", error: e };
  }
};
