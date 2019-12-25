
'use strict';
const Sequelize = require('sequelize');
const {sequelize,OrderItem, ShippingAddress,Review, Plates, User, Ingredient, PlateImage, KitchenImage, ReceiptImage, PlateCategory } = require('../models/index');
const Op = Sequelize.Op;

exports.createIngredient = async (data) => {
  try {
    const response = await Ingredient.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save ingredient", error: e };
  }
}

exports.updateIngredient = async (data) => {
  try {
    const response = await Ingredient.bulkCreate(data, { updateOnDuplicate: ["name", "purchase_date"] });
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update ingredient", error: e };
  }
}

exports.createPlateImage = async (data) => {
  try {
    const response = await PlateImage.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save ingredient", error: e };
  }
}

exports.createKitchenImage = async (data) => {
  try {
    const response = await KitchenImage.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save ingredient", error: e };
  }
}

exports.createReceiptImage = async (data) => {
  try {
    const response = await ReceiptImage.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save ingredient", error: e };
  }
}

exports.listNear = async (data) => {
  let { latitude, longitude, radiusMiles } = data;
  const globalRadiusMilies = parseFloat(3958,756);
  const radiusCurrent = (radiusMiles) ? parseFloat(parseFloat(radiusMiles) / globalRadiusMilies) : parseFloat(0.00631);

  /*
  let query = `SELECT 
                P.userId, 
                ( 3959 * acos( cos( radians(${latitude}) ) * cos( radians( location_lat ) ) * cos( radians( location_lon ) - radians(${longitude}) ) + sin( radians(${latitude}) ) * sin(radians(location_lat)) ) ) AS distance,
                P.id AS plate_id, 
                P.delivery_type, 
                P.name, 
                pimage.url as imageURL,
                P.price, 
                P.description, 
                P.delivery_time,
                P.rating 
              FROM Users as U 
              LEFT JOIN Plates as P on U.id = userId 
              LEFT JOIN (SELECT plateId, url FROM PlateImages group by plateId ) as pimage on pimage.plateId = P.id
              WHERE U.id = P.userId and U.user_type = 'chef' 
              ORDER BY distance LIMIT 0 , 20;`;
  */
 let query = `
  SELECT
  P.id AS plate_id, 
  P.delivery_type, 
  P.name,
  P.price,
  pimage.url as imageURL,
  P.description, 
  P.delivery_time,
  P.rating 
  FROM Users as U
  LEFT JOIN Plates as P on U.id = userId
  LEFT JOIN (SELECT plateId, url FROM PlateImages group by plateId, url) as pimage on pimage.plateId = P.id
  WHERE U.id = P.userId 
  and U.user_type = 'chef'
  and U.location_lat <= ${(parseFloat(latitude) + radiusCurrent)}
  and U.location_lat >= ${(parseFloat(latitude) - radiusCurrent)}
  and U.location_lon <= ${(parseFloat(longitude) + radiusCurrent)}
  and U.location_lon >= ${(parseFloat(longitude) - radiusCurrent)}
 `;
//    Column distance not found
//              HAVING distance < ${radiusMiles} ORDER BY distance LIMIT 0 , 20;`;
  try {
    const response = await ReceiptImage.sequelize.query(query, { raw: true });
    let resultado = JSON.stringify(response);
    resultado = JSON.parse(resultado);
    return resultado[0];
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e };
  }
}

exports.searchLatestPlates = async (data) => {
  const { amount } = data;

  const limit = (amount && (amount >= 1)) ? amount : 10;
  let query = `
    SELECT
    P.id as plate_id,
    P.delivery_type,
    P.name,
    P.price,
    pimage.url as imageURL,
    P.description, 
    P.delivery_time,
    P.rating 
    FROM database_development.Plates as P 
    LEFT JOIN (SELECT plateId, url FROM PlateImages group by plateId, url) as pimage on pimage.plateId = P.id
    order by id desc limit ${limit}
    `;
  try {
    const response = await ReceiptImage.sequelize.query(query, { raw: true });
    return JSON.parse(JSON.stringify(response))[0]
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.findPlate = async (data) => {
  try {
    const existPlate = await Plates.findByPk(data, {
      attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'sell_count' ],
      include: [
        {
          model: PlateCategory,
          as: 'category',
          attributes: [ 'name', 'description', 'url' ]
        },
        {
          model: Ingredient,
          attributes: [ 'id', 'name', 'purchase_date' ]
        },
        {
          model: PlateImage,
          attributes: [ 'id', 'name', 'url' ]
        },
        {
          model: KitchenImage,
          attributes: [ 'id', 'name', 'url' ]
        },
        {
          model: ReceiptImage,
          attributes: [ 'id', 'name', 'url' ]
        },
        {
          model: User,
          as: 'chef'
        }
      ]
    });
    return existPlate;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to get Plate!", error: e };
  }
}

exports.getPlate = async (data) => {
  try {
    const existPlate = await Plates.findByPk(data, {
      attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'sell_count', 'rating' ],
      include: [
        {
          model: PlateCategory,
          as: 'category',
          attributes: [ 'name', 'description', 'url' ]
        },
        {
          model: Ingredient,
          attributes: [ 'name', 'purchase_date' ]
        },
        {
          model: PlateImage,
          attributes: [ 'name', 'url' ]
        },
        {
          model: KitchenImage,
          attributes: [ 'name', 'url' ]
        },
        {
          model: ReceiptImage,
          attributes: [ 'name', 'url' ]
        },
        {
          model: Review,
          attributes: [ 'comment','rating' ],
          as:'reviews',
          include: [{
            model: User,
            attributes: ['id', 'name'],
            as:'user'
          }]
        },        
        {
          model: User,
          as: 'chef'
        }
        
      ],
      nested: true 
    });
    return existPlate;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to get Plate!", error: e };
  }
}

exports.listPlates = async (data) => {
  if (data.page == 1) {
    try {
      const existPlates = await Plates.findAll({
          include: [
            {
              model: PlateImage,
              attributes: [ 'name', 'url' ]
            }
          ],
          attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'sell_count' ],
          order: [ ['id', 'DESC'] ],
          limit: parseInt(data.pageSize)
        });
        return existPlates;
      } catch (e) {
        console.log("Error: ", e);
        return { message: "Fail to get Plates!", error: e };
      }
  }

  try {
    let skiper = data.pageSize * (data.page - 1)
    const existPlates = await Plates.findAll({
        include: [
          {
            model: PlateImage,
            attributes: [ 'name', 'url' ]
          }
        ],
        attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'sell_count' ],
        order: [ ['id', 'DESC'] ],
        offset: parseInt(skiper),
        limit: parseInt(data.pageSize),
      });
      return existPlates;
    } catch (e) {
      console.log("Error: ", e);
      return { message: "Fail to get Plates!", error: e };
    }
}

exports.getRelatedPlate = async (plateId) => {
  try {
    let plateFind = await Plates.findByPk(parseInt(plateId));
    if(plateFind){
      // let relatedPlates = await Plates.findAll({where:{
      //   id: {[Op.notIn]:[parseInt(plateId)]},
      //   categoryId:parseInt(plateFind.categoryId)
      // }});
      // return relatedPlates;


      let options =   {
        where: {id: {[Op.notIn]:[parseInt(plateId)]}},
        attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'sell_count', 'categoryId', 'createdAt' ],
        include: [
          {
            model: PlateCategory,
            as: 'category',
            attributes: [ 'name', 'description', 'url' ]
          },
          {
            model: Ingredient,
            attributes: [ 'id', 'name', 'purchase_date' ]
          },
          {
            model: PlateImage,
            attributes: [ 'id', 'name', 'url' ]
          },
          {
            model: KitchenImage,
            attributes: [ 'id', 'name', 'url' ]
          },
          {
            model: ReceiptImage,
            attributes: [ 'id', 'name', 'url' ]
          },
          {
            model: Review,
            attributes: [ 'comment','rating' ],
            as:'reviews',
            include: [{
              model: User,
              attributes: ['id', 'name'],
              as:'user'
            }]
          },
//          {
//            model: User,
//            as:'chef',
//            include: [{
//              model: ShippingAddress
//            }]
//          }
        ]
      };
    
      try {
        let relatedPlates = await Plates.findAll (options);
        return relatedPlates;
      } catch (e) {
        console.log("Error: ", e);
         return { message: "Fail to get Plate!", error: e };
      }














    }else{
      return false;
    }
  } catch (error) {
    throw error;
  }
}


exports.getPlateReviewByPlateId = async (data,limit) => {

  if(!data.page){
    data.page = 1;
  }

  if(!data.pageSize){
    data.pageSize=10
  }
  if (data.page == 1) {
    try {
      // const existPlates = await PlateReview.findAll({
      //     where: {
      //       plateId:parseInt(data.id)
      //     },
      //     include: [{
      //       model: User,
      //       required: true,
      //       as: 'user'}],
      //     limit: parseInt(data.pageSize)
      //   });
        let sql = `select u.name, pr.* from Reviews pr
        inner join Users u on pr.userId = u.id
          where pr.plateId = ${data.id} `;

        if(limit){
          sql = sql + `limit=${limit}`;
        }

        let existPlates = await sequelize.query(sql);

        return existPlates;
      } catch (e) {
        console.log("Error: ", e);
        return { message: "Fail to get Plate Reviews!", error: e };
      }
  }

  try {
    let skiper = data.pageSize * (data.page - 1)
    const Reviews = await Review.findAll({
        where: {
          palteId:plate
        },
        offset: parseInt(skiper),
        limit: parseInt(data.pageSize),
      });
      return Reviews;
    } catch (e) {
      console.log("Error: ", e);
      return { message: "Fail to get Plate Reviews!", error: e };
    }
}


exports.listPlates2 = async (data) => {
  
  let { latitude, longitude, radiusMiles, newest } = data;
  let nearbyPlates = false;
  let options =   {
    where: {},
    attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'sell_count', 'categoryId', 'createdAt' ],
    include: [
      {
        model: PlateCategory,
        as: 'category',
        attributes: [ 'name', 'description', 'url' ]
      },
      {
        model: Ingredient,
        attributes: [ 'id', 'name', 'purchase_date' ]
      },
      {
        model: PlateImage,
        attributes: [ 'id', 'name', 'url' ]
      },
      {
        model: KitchenImage,
        attributes: [ 'id', 'name', 'url' ]
      },
      {
        model: ReceiptImage,
        attributes: [ 'id', 'name', 'url' ]
      },
      {
        model: Review,
        attributes: [ 'comment','rating' ],
        as:'reviews',
        include: [{
          model: User,
          attributes: ['id', 'name'],
          as:'user'
        }]
      },
      {
        model: User,
        as:'chef',
        include: [{
          model: ShippingAddress,
          as:'address'
        }]
      }
    ]
  };

  if(latitude && longitude && radiusMiles){

    let query = `SELECT 
                  P.userId, 
                  ( 3959 * acos( cos( radians(${latitude}) ) * cos( radians( location_lat ) ) * cos( radians( location_lon ) - radians(${longitude}) ) + sin( radians(${latitude}) ) * sin(radians(location_lat)) ) ) AS distance,
                  P.id AS plate_id, 
                  P.delivery_type, 
                  P.name, 
                  pimage.url as imageURL,
                  P.price, 
                  P.description, 
                  P.delivery_time,
                  P.rating 
                FROM Users as U 
                LEFT JOIN Plates as P on U.id = userId 
                LEFT JOIN (SELECT plateId, url FROM PlateImages group by plateId ) as pimage on pimage.plateId = P.id
                WHERE U.id = P.userId and U.user_type = 'chef' 
                HAVING distance < ${radiusMiles} ORDER BY distance LIMIT 0 , 20;`;
    try {
      const response = await sequelize.query(query, { raw: true,type: sequelize.QueryTypes.SELECT });
      let plateIds = response.map(function(item){
        return item.plate_id;
      });
      let resultado = JSON.stringify(response);

      options.where.id = plateIds;

    } catch (e) {
      console.log("Error: ", e);
      return { message: "Fail the plates", error: e };
    }

  }

  if(newest){
    options.order = [['createdAt', 'DESC']];
  }


  try {
    const existPlate = await Plates.findAll (options);
    return existPlate;
  } catch (e) {
    console.log("Error: ", e);
     return { message: "Fail to get Plate!", error: e };
  }
}

exports.getChefPlates = async (data) => {
  const { userId } = data;
  let query = `
  SELECT
  P.id AS plate_id, 
  P.delivery_type, 
  P.name,
  P.price,
  pimage.url as imageURL,
  P.description, 
  P.delivery_time,
  P.rating 
  FROM Users as U
  LEFT JOIN Plates as P on U.id = ${userId}
  LEFT JOIN (SELECT plateId, url FROM PlateImages group by plateId, url) as pimage on pimage.plateId = P.id
  WHERE U.id = P.userId 
  and U.user_type = 'chef'
  `;
  try {
    const response = await ReceiptImage.sequelize.query(query, { raw: true });
    return JSON.parse(JSON.stringify(response))[0]
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.deletePlateImage = async (data) => {
  try {
    await PlateImage.destroy({
      where: { id: data }
    });
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.deleteReceiptImage = async (data) => {
  try {
    await ReceiptImage.destroy({
      where: { id: data }
    });
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.deleteKitchenImage = async (data) => {
  try {
    await KitchenImage.destroy({
      where: { id: data }
    });
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.getPlateSearch = async (data) => {
  try {
    const response = await Plates.findAll({
      where: {
        name:{[Op.like]:'%'+data+'%'}
      },
      attributes: {
          exclude: ['UserId']
        },
    });
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};