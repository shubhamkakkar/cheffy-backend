'use strict';
const {
  Documents,
  ProfilePhoto,
  NIDFrontSide,
  KitchenPhoto,
  ChefLicense,
  ChefCertificate
} = require("../models/index");

exports.getUserDocs = async (state, data) => {
  if (state && data) {
    const existUserDocs = await Documents.findOne({
      where: { userId: data },
      include: [
        {
          model: ChefLicense,
          where: { state_type:  state },
          attributes: ["description", "url", "state_type"]
        },
        {
          model: ChefCertificate,
          where: { state_type:  state },
          attributes: ["description", "url", "state_type"]
        },
        {
          model: KitchenPhoto,
          where: { state_type:  state },
          attributes: ["description", "url", "state_type"]
        },
        {
          model: NIDFrontSide,
          where: { state_type:  state },
          attributes: ["description", "url", "state_type"]
        },
        {
          model: ProfilePhoto,
          where: { state_type:  state },
          attributes: ["description", "url", "state_type"]
        }
      ],
      order: [["id", "DESC"]]
    });
    return existUserDocs;
  }
  const existUserDocs = await Documents.findOne({
    where: { userId: state },
    include: [
      {
        model: ChefLicense,
        attributes: ["description", "url", "state_type"]
      },
      {
        model: ChefCertificate,
        attributes: ["description", "url", "state_type"]
      },
      {
        model: KitchenPhoto,
        attributes: ["description", "url", "state_type"]
      },
      {
        model: NIDFrontSide,
        attributes: ["description", "url", "state_type"]
      },
      {
        model: ProfilePhoto,
        attributes: ["description", "url", "state_type"]
      }
    ],
    order: [["id", "DESC"]]
  });
  return existUserDocs;
};

exports.getUserDoc = async (data) => {
  const existUserDoc = await Documents.findOne({
    where: { id: data },
    include: [
      {
        model: ChefLicense,
        attributes: ["id", "description", "url", "state_type"]
      },
      {
        model: ChefCertificate,
        attributes: ["id", "description", "url", "state_type"]
      },
      {
        model: KitchenPhoto,
        attributes: ["id", "description", "url", "state_type"]
      },
      {
        model: NIDFrontSide,
        attributes: ["id", "description", "url", "state_type"]
      },
      {
        model: ProfilePhoto,
        attributes: ["id", "description", "url", "state_type"]
      }
    ]
  });
  return existUserDoc;
};

exports.createDoc = async (data) => {
  let doc = await Documents.create({ ...data });
  return doc;
}

exports.updateDoc = async (data) => {
  try {
    const response = await Documents.findByPk(data.id)
    response.comment = data.comment || null
    response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Docs", error: e };
  }
}

exports.userUpdateDoc = async (data) => {
  try {
    const response = await Documents.findByPk(data)
    response.state_type = 'pending'
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Docs", error: e };
  }
}

exports.createChefLicense = async (id, data) => {
  let payload = data;
  payload.documentId = id;
  let doc = await ChefLicense.create({ ...payload });
  return doc;
}

exports.updateChefLicense = async (data) => {
  try {
    const response = await ChefLicense.findByPk(data.id)
    response.description = data.description || null
    response.url = data.url || null
    response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}

exports.createChefCertificate = async (id, data) => {
  let payload = data;
  payload.documentId = id;
  let doc = await ChefCertificate.create({ ...payload });
  return doc;
};

exports.updateChefCertificate = async (data) => {
  try {
    const response = await ChefCertificate.findByPk(data.id)
    response.description = data.description || null
    response.url = data.url || null
    response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}

exports.createKitchenPhoto = async (id, data) => {
  let payload = data;
  payload.documentId = id;
  let doc = await KitchenPhoto.create({ ...payload });
  return doc;
};

exports.updateKitchenPhoto = async (data) => {
  try {
    const response = await KitchenPhoto.findByPk(data.id)
    response.description = data.description || null
    response.url = data.url || null
    response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}

exports.createNIDFrontSide = async (id, data) => {
  let payload = data;
  payload.documentId = id;
  let doc = await NIDFrontSide.create({ ...payload });
  return doc;
};

exports.updateNIDFrontSide = async (data) => {
  try {
    const response = await NIDFrontSide.findByPk(data.id)
    response.description = data.description || null
    response.url = data.url || null
    response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}

exports.createProfilePhoto = async (id, data) => {
  let payload = data;
  payload.documentId = id;
  let doc = await ProfilePhoto.create({ ...payload });
  return doc;
};

exports.updateProfilePhoto = async (data) => {
  try {
    const response = await ProfilePhoto.findByPk(data.id)
    response.description = data.description || null
    response.url = data.url || null
    response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}
