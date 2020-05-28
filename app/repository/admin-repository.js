'use strict';
const {
  Documents,
  ProfilePhoto,
  NIDFrontSide,
  KitchenPhoto,
  ChefLicense,
  ChefCertificate,
  User
} = require("../models/index");


exports.listAllDocs = async () => {
  const list_docs = await Documents.findAll({
    attributes: ["id", "comment", "state_type", "createdAt", "updatedAt"],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ["id", "name", "email", "verification_email_status", "verification_phone_status"]
      },
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
  return list_docs;
};

exports.authenticateToken = async data => {
  const res = await User.findOne({
    where: { password: data.token, user_type: 'admin' }
  });
  return res;
};
