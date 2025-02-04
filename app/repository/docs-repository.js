"use strict";
const path = require("path");
const {
  Documents,
  ProfilePhoto,
  NIDFrontSide,
  KitchenPhoto,
  ChefLicense,
  ChefCertificate,
  DriverLicenseFrontSide,
  User,
  DriverVehicleRegistration,
} = require("../models/index");
const documentConstants = require(path.resolve("app/constants/documents"));
const userConstants = require(path.resolve("app/constants/users"));
const uploadService = require("../services/upload");
const userRepository = require("./user-repository");
const driverIncludes = [
  {
    model: ProfilePhoto,
    attributes: ["description", "url", "state_type"],
  },
  {
    model: DriverLicenseFrontSide,
    attributes: ["id", "name", "url", "state_type"],
  },
  {
    model: DriverVehicleRegistration,
    attributes: ["id", "name", "url", "state_type"],
  },
];

const chefIncludes = [
  {
    model: ChefLicense,
    attributes: ["description", "url", "state_type"],
  },
  {
    model: ChefCertificate,
    attributes: ["description", "url", "state_type"],
  },
  {
    model: KitchenPhoto,
    attributes: ["description", "url", "state_type"],
  },
  {
    model: NIDFrontSide,
    attributes: ["description", "url", "state_type"],
  },
];

exports.getUserDocs = async (state, data) => {
  if (state && data) {
    const existUserDocs = await Documents.findOne({
      where: { userId: data },
      include: [
        ...chefIncludes,
        {
          model: ProfilePhoto,
          where: { state_type: state },
          attributes: ["description", "url", "state_type"],
        },
      ],
      order: [["id", "DESC"]],
    });
    return existUserDocs;
  }
  const existUserDocs = await Documents.findOne({
    where: { userId: state },
    include: [...chefIncludes, ...driverIncludes],
    order: [["id", "DESC"]],
  });
  return existUserDocs;
};

exports.getUserDoc = async (userId) => {
  try {
    return await Documents.findOne({
      where: { userId },
      include: [...chefIncludes, ...driverIncludes],
    });
  } catch (error) {
    return {
      error: true,
      data: error,
    };
  }
};

exports.getDriverDocs = async (state, data) => {
  if (state && data) {
    const existUserDocs = await Documents.findOne({
      where: { userId: data },
      include: driverIncludes,
      order: [["id", "DESC"]],
    });
    return existUserDocs;
  }
  const existUserDocs = await Documents.findOne({
    where: { userId: state },
    include: driverIncludes,
    order: [["id", "DESC"]],
  });
  return existUserDocs;
};

exports.getDriverDoc = async (userId) => {
  const existUserDoc = await Documents.findOne({
    where: { userId },
    include: driverIncludes,
  });
  return existUserDoc;
};

exports.getAllDriverChefDocsWithFilter = async ({
  pagination,
  user_type,
  ...where
}) => {
  if (where.name) {
  }

  console.log({ where });

  const queryOptions = {
    pagination,
    where,
    include: [
      ...(user_type === userConstants.USER_TYPE_DRIVER
        ? driverIncludes
        : chefIncludes),
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
    attributes: [
      "id",
      "comment",
      "social_security_number",
      "updatedAt",
      "createdAt",
    ],
  };
  return await Documents.findAll(queryOptions);
};

/**
 * Get document by id. Should return all fields for different user types
 */
exports.getDocById = async (docId) => {
  const response = await Documents.findByPk(docId, {
    include: [...driverIncludes, ...chefIncludes],
  });

  return response;
};

/**
 * Get doc by id with minimum attributes
 */
exports.getDocMin = async (docId) => {
  const response = await Documents.findByPk(docId, {
    attributes: documentConstants.minSelectFields,
  });

  return response;
};

exports.createDoc = async (data) => {
  let doc = await Documents.create({ ...data });
  return doc;
};

exports.updateDoc = async (data) => {
  try {
    const response = await Documents.findByPk(data.id);

    response.comment = data.comment || null;
    response.state_type = data.state_type || null;
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Docs", error: e };
  }
};

exports.userUpdateDoc = async (documentId) => {
  const response = await Documents.findByPk(documentId);
  if (!response) {
    throw new Error("User Document Not Found");
  }

  response.state_type = documentConstants.STATUS_PENDING;
  await response.save();
  return response;
};

exports.createChefLicense = async (documentId, data) => {
  const { originalname, key } = data;

  let doc = await ChefLicense.create({
    description: originalname,
    url: key,
    documentId,
  });

  return doc;
};

exports.updateChefLicense = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await ChefLicense.findOne({ where: { documentId } });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue("url"));
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
};

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
      await uploadService.deleteImage(fieldname, response.getDataValue("url"));
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
};

exports.createKitchenPhoto = async (documentId, data) => {
  const { originalname, key } = data;

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
      await uploadService.deleteImage(fieldname, response.getDataValue("url"));
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
};

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
      await uploadService.deleteImage(fieldname, response.getDataValue("url"));
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
};

exports.createDriverLicense = async (documentId, data) => {
  const { originalname, key } = data;

  let doc = await DriverLicenseFrontSide.create({
    documentId,
    url: key,
    name: originalname,
  });

  return doc;
};

exports.updateDriverLicense = async (documentId, data) => {
  try {
    const { originalname, key, fieldname } = data;
    const response = await DriverLicenseFrontSide.findOne({
      where: { documentId },
    });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue("url"));
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
  const { originalname, key, url } = data;

  let doc = await DriverVehicleRegistration.create({
    documentId,
    url: url,
    name: originalname,
  });

  return doc;
};

exports.updateDriverVehicleRegistration = async (documentId, data) => {
  try {
    const { originalname, key, url, fieldname } = data;
    const response = await DriverVehicleRegistration.findOne({
      where: { documentId },
    });

    if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue("url"));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    }

    response.name = originalname;
    response.url = url;
    //response.state_type = data.response || null
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Driver docs", error: e };
  }
};

exports.createProfilePhoto = async (documentId, data) => {
  const { originalname, key, url } = data;

  let doc = await ProfilePhoto.create({
    description: originalname,
    url: url,
    documentId,
  });
  return doc;
};

exports.updateProfilePhoto = async (documentId, data) => {
  try {
    const { originalname, key, url, fieldname } = data;
    const response = await ProfilePhoto.findOne({ where: { documentId } });

    /*  Commmenting this as delete image has to be done from cloudinary
   if (response)
      await uploadService.deleteImage(fieldname, response.getDataValue('url'));
    else {
      await uploadService.deleteImage(fieldname, key);
      return 0;
    } */

    response.description = originalname;
    response.url = url;
    response.state_type = "validated";
    await response.save();
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update Profile docs", error: e };
  }
};
