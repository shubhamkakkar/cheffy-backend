'use strict';
const {
  Documents,
  ProfilePhoto,
  NIDFrontSide,
  KitchenPhoto,
  ChefLicense,
  ChefCertificate,
  DriverLicenseFrontSide,
  DriverVehicleRegistration,
} = require("../models/index");

const uploadService = require('../services/upload');

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
      },
      {
        model: DriverLicenseFrontSide,
        attributes: ['id', 'name', 'url', 'state_type']
      },
      {
        model: DriverVehicleRegistration,
        attributes: ['id', 'name', 'url', 'state_type']
      }
    ],
    order: [["id", "DESC"]]
  });
  return existUserDocs;
};

exports.getDriverDocs = async (state, data) => {
  if (state && data) {
    const existUserDocs = await Documents.findOne({
      where: { userId: data },
      include: [
        {
          model: ProfilePhoto,
          attributes: ["description", "url", "state_type"]
        },
        {
          model: DriverLicenseFrontSide,
          attributes: ['id', 'name', 'url', 'state_type']
        },
        {
          model: DriverVehicleRegistration,
          attributes: ['id', 'name', 'url', 'state_type']
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
        model: ProfilePhoto,
        attributes: ["description", "url", "state_type"]
      },
      {
        model: DriverLicenseFrontSide,
        attributes: ['id', 'name', 'url', 'state_type']
      },
      {
        model: DriverVehicleRegistration,
        attributes: ['id', 'name', 'url', 'state_type']
      }
    ],
    order: [["id", "DESC"]]
  });
  return existUserDocs;
};

exports.getChefDoc = async (data) => {
  const existUserDoc = await Documents.findOne({
    where: {  userId: data },
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [
      {
        model: ProfilePhoto,
        attributes: ["description", "url", "state_type"]
      },
      {
        model: ChefLicense,
        attributes: ['id', 'description', 'url', 'state_type']
      },
      {
        model: ChefCertificate,
        attributes: ['id', 'description', 'url', 'state_type']
      },
      {
        model: NIDFrontSide,
        attributes: ['id', 'description', 'url', 'state_type']
      },
      {
        model: KitchenPhoto,
        attributes: ['id', 'description', 'url', 'state_type']
      },
    ]
  });
  return existUserDoc;
};


exports.getDriverDoc = async (data) => {
  const existUserDoc = await Documents.findOne({
    where: { userId: data },
    attributes: ['id', 'state_type', 'userId', 'social_security_number'],
    include: [
      {
        model: ProfilePhoto,
        attributes: ["description", "url", "state_type"]
      },
      {
        model: DriverLicenseFrontSide,
        attributes: ['id', 'name', 'url', 'state_type']
      },
      {
        model: DriverVehicleRegistration,
        attributes: ['id', 'name', 'url', 'state_type']
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

exports.userUpdateDoc = async (documentId) => {
  try {
    const response = await Documents.findByPk(documentId);

    response.state_type = 'pending'
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Docs", error: e };
  }
}

exports.createChefLicense = async (documentId, data) => {
  const { originalname, key } = data;

  let doc = await ChefLicense.create({
    description: originalname,
    url: key,
    documentId,
  });

  return doc;
}

exports.updateChefLicense = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await ChefLicense.findOne({ where: { documentId } });
    
    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue('url'));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    }

    response.description = originalname;
    response.url = key;
    //response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}

exports.createChefCertificate = async (documentId, data) => {
  const { originalname, key } = data;

  let doc = await ChefCertificate.create({
    description: originalname,
    url: key,
    documentId,
  });
  return doc;
};

exports.updateChefCertificate = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await ChefCertificate.findOne({ where: { documentId } });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue('url'));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    }
    
    response.description = originalname;
    response.url = key;
    //response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}

exports.createKitchenPhoto = async (documentId, data) => {
  const { originalname, key} = data;

  let doc = await KitchenPhoto.create({
    description: originalname,
    url: key,
    documentId,
  });
  return doc;
};

exports.updateKitchenPhoto = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await KitchenPhoto.findOne({ where: { documentId } });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue('url'));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    }

    response.description = originalname;
    response.url = key;
    //response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}

exports.createNIDFrontSide = async (documentId, data) => {
  const { originalname, key } = data;

  let doc = await NIDFrontSide.create({
    description: originalname,
    url: key,
    documentId,
  });
  return doc;
};

exports.updateNIDFrontSide = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await NIDFrontSide.findOne({ where: { documentId } });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue('url'));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    }
    response.description = originalname;
    response.url = key;
    //response.state_type = data.state_type || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}

exports.createDriverLicense = async (documentId, data) => {
  const { originalname, key } = data;

  let doc = await DriverLicenseFrontSide.create({
    documentId,
    url: key,
    name: originalname
  });

  return doc;
};

exports.updateDriverLicense = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await DriverLicenseFrontSide.findOne({ where: { documentId } });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue('url'));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    }

    response.name = originalname;
    response.url = key;
    //response.state_type = data.response || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Driver docs", error: e };
  }
};

exports.createDriverVehicleLicense = async (documentId, data) => {
  const { originalname, key } = data;

  let doc = await DriverVehicleRegistration.create({
    documentId,
    url: key,
    name: originalname
  });

  return doc;
};

exports.updateDriverVehicleRegistration = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await DriverVehicleRegistration.findOne({ where: { documentId } });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue('url'));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    }

    response.name = originalname;
    response.url = key;
    //response.state_type = data.response || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Driver docs", error: e };
  }
};

exports.createProfilePhoto = async (documentId, data) => {
  const { originalname, key } = data;

  let doc = await ProfilePhoto.create({
    description: originalname,
    url: key,
    documentId,
  });
  return doc;
};

exports.updateProfilePhoto = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await ProfilePhoto.findOne({ where: { documentId } });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue('url'));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    }

    response.description = originalname;
    response.url = key;
    //response.state_type = data.response || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Chef docs", error: e };
  }
}