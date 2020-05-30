const {
  Devices,
  User,
  ShippingAddress,
  sequelize,
} = require("../models/index");
const path = require("path");
const userConstants = require(path.resolve("app/constants/users"));
const Sequelize = require("sequelize");

exports.findDriversInsideArea = async (latitude, longitude, radiusMiles) => {
  let strQuery =
    "SELECT id, ( 3959 * acos( cos( radians(" +
    latitude +
    ") ) * cos( radians( CAST(SUBSTRING_INDEX(location, ',', 1) AS DECIMAL(10,6)) ) ) " +
    "* cos( radians( CAST(SUBSTRING_INDEX(location, ',', -1) AS DECIMAL(10,6)) ) - radians(" +
    longitude +
    ") ) + sin( radians(" +
    latitude +
    ")) *" +
    " sin(radians(CAST(SUBSTRING_INDEX(location, ',', 1) AS DECIMAL(10,6)))) ) ) AS distance " +
    "FROM Users " +
    "where user_type='user' " + // we need to create a new enum for drivers on the db
    "HAVING distance < " +
    parseInt(radiusMiles);
  "ORDER BY distance " + "LIMIT 0 , 20;";
  /*console.log(strQuery);*/
  let result = await sequelize.query(strQuery);
  return result;
};

exports.getAllDriver = async ({ pagination, ...where }) => {
  const queryOptions = {
    pagination,
    where,
  };

  const response = await User.findAll(queryOptions);
  return response;
};

exports.acceptUserVerification = async (userId) => {
  let user = await User.findByPk(userId);
  user.adminVerficaton = true;

  try {
    await user.save();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.rejectUserVerification = async (userId) => {
  let user = await User.findByPk(userId);
  user.adminVerficaton = false;

  try {
    await user.save();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.getUserById = async (userId) => {
  let user = await User.findOne({
    where: { id: userId },
    include: [
      {
        model: ShippingAddress,
        as: "address",
      },
    ],
  });

  if (user) {
    try {
      let userFavoritePlates = await getUserFavoritePlates(userId);
      let userWithFavPlates = JSON.parse(JSON.stringify(user));
      userWithFavPlates.favorite_plates = JSON.parse(
        JSON.stringify(userFavoritePlates)
      );
      return userWithFavPlates;
    } catch (error) {
      throw error;
    }
  }
  return user;
};

exports.saveStripeinfo = async (userId, stripeUser) => {
  let user = await User.findByPk(userId);
  user.stripe_id = stripeUser.id;
  user.save();
  return user;
};

function getUserFavoritePlates(userID) {
  let favoriteSQL = `SELECT oi.plate_id, oi.name, c.total FROM  OrderItems oi inner join ( SELECT plate_id, count(plate_id) as total
    from OrderItems GROUP BY plate_id) c ON oi.plate_id = c.plate_id where oi.user_id = ${userID} LIMIT 3`;
  return sequelize.query(favoriteSQL, { raw: true, nest: true });
}

exports.getRestaurantSearch = async (data) => {
  try {
    const response = await User.findAll({
      where: {
        restaurant_name: { [Sequelize.Op.like]: "%" + data + "%" },
      },
      attributes: [
        "id",
        "restaurant_name",
        "location_lat",
        "location_lon",
        "createdAt",
        "updatedAt",
      ],
    });

    return response;
  } catch (e) {
    /*console.log("Error: ", e);*/
    return { message: "Fail the plates", error: e };
  }
};

exports.validatePhone = async (userId, smsToken) => {
  let user = await User.findOne({
    where: { id: userId, verification_phone_token: smsToken },
  });

  if (user) {
    user.verification_phone_token = "";
    user.verification_phone_status = userConstants.STATUS_VERIFIED;
    await user.save();
    return true;
  }

  return false;
};

exports.addDevice = async (data) => {
  const query = `INSERT INTO Devices (deviceName,deviceId,deviceToken,userId,createdAt,updatedAt) VALUES 
	('${data.deviceName}','${data.deviceId}','${data.deviceToken}','${data.userId}',NOW(),NOW()) ON DUPLICATE 
	KEY UPDATE deviceName=VALUES(deviceName), deviceId=VALUES(deviceId),deviceToken=VALUES(deviceToken), 
	userId=VALUES(userId), updatedAt=VALUES(updatedAt)`;
  const result = await sequelize.query(query, {
    type: sequelize.QueryTypes.INSERT,
    returning: true,
  });
  return result;
};

exports.deleteUserAccount = async (data) => {
  return await User.destroy({
    where: {
      id: data,
    },
  });
};
