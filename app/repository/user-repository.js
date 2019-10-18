const {sequelize, User, ShippingAddress} = require('../models/index')
const { getModelSQLTypes, getModelSQLTypesQuery } = require('../../helpers/model-type');

exports.findDriversInsideArea = async (latitude,longitude,radiusMiles) => {
    let strQuery = "SELECT id, ( 3959 * acos( cos( radians("+latitude+") ) * cos( radians( CAST(SUBSTRING_INDEX(location, ',', 1) AS DECIMAL(10,6)) ) ) "+
                    "* cos( radians( CAST(SUBSTRING_INDEX(location, ',', -1) AS DECIMAL(10,6)) ) - radians("+longitude+") ) + sin( radians("+latitude+")) *"+
                    " sin(radians(CAST(SUBSTRING_INDEX(location, ',', 1) AS DECIMAL(10,6)))) ) ) AS distance "+
                    "FROM Users "+
                    "where user_type='user' "+// we need to create a new enum for drivers on the db
                    "HAVING distance < "+parseInt(radiusMiles)
                    "ORDER BY distance "+
                    "LIMIT 0 , 20;";
    console.log(strQuery)
    let result = await sequelize.query(strQuery);

    return result;
}

exports.getUserById = async (userId) => {
    let user = await User.findOne({
        where: {id:userId},
        include:[
            {
                model:ShippingAddress,
                as:'address'}
        ]
    });
    if(user){
        try {
            let userFavoritePlates = await getUserFavoritePlates(userId);
            let userWithFavPlates = JSON.parse(JSON.stringify(user));
            userWithFavPlates.favorite_plates = JSON.parse(JSON.stringify(userFavoritePlates));
            return userWithFavPlates;
        } catch (error) {
            throw error;
        }
    }
    return user;
}

exports.saveStripeinfo = async (userId,stripeUser) => {
    let user = await User.findByPk(userId);
    user.stripe_id = stripeUser.id;
    user.save();
    return user;
}

function getUserFavoritePlates(userID) {
    let favoriteSQL = `SELECT oi.plate_id, oi.name, c.total FROM  OrderItems oi
                        inner join ( SELECT plate_id, count(plate_id) as total
                                        from OrderItems
                                        GROUP BY plate_id) c ON oi.plate_id = c.plate_id
                        where oi.user_id = ${userID}
                        LIMIT 3`;

    return sequelize.query(favoriteSQL,{raw:true,nest:true});
}

exports.getModelType = async (model) => {
  // const res = await getModelSQLTypes(User);
  const res = await getModelSQLTypesQuery('Users');
  return res;
}
