"use strict";
var HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/docs-repository");
const md5 = require("md5");
const authService = require("../services/auth");


exports.create = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const actual = await repository.getUserDocs(token_return.id);

  if (actual) {
    res.status(HttpStatus.ACCEPTED).send({ message: "You already have documents applied", data: actual });
    return 0;
  }

  let new_doc = await repository.createDoc({
    comment: "",
    userId: token_return.id
  });

  await repository.createChefLicense(new_doc.id, req.body.chef_license);
  await repository.createChefCertificate(new_doc.id, req.body.chef_certificate);
  await repository.createKitchenPhoto(new_doc.id, req.body.kitchen_photo);
  await repository.createNIDFrontSide(new_doc.id, req.body.front_side);
  await repository.createProfilePhoto(new_doc.id, req.body.profile_photo);

  const saved_data = await repository.getUserDocs(token_return.id);

  res.status(HttpStatus.ACCEPTED).send({ message: "Documents successfully saved", data: saved_data });
}


exports.list = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  let user_docs;

  if (req.query.state) {
    user_docs = await repository.getUserDocs(req.query.state, token_return.id);
  }else{
    user_docs = await repository.getUserDocs(token_return.id);
  }

  if (user_docs) {
    res.status(HttpStatus.ACCEPTED).send(user_docs);
    return 0;
  }
  res.status(HttpStatus.ACCEPTED).send({
    message: "No documents found!",
    error: false
  });
};

exports.edit = async (req, res, next) => {
  try {
    let existDocs = await repository.getUserDoc(req.params.id);
    if (!existDocs) {
      res.status(HttpStatus.CONFLICT).send({ message: "We couldn't find your docs", status: HttpStatus.CONFLICT});
      return 0;
    }

    await repository.updateChefLicense(req.body.chef_license)
    await repository.updateChefCertificate(req.body.chef_certificate)
    await repository.updateKitchenPhoto(req.body.kitchen_photo)
    await repository.updateNIDFrontSide(req.body.front_side)
    await repository.updateProfilePhoto(req.body.profile_photo)
    await repository.userUpdateDoc(req.params.id)

    const updatedDocs = await repository.getUserDoc(req.params.id);

    res.status(200).send({ message: 'Docs successfully updated!', data: updatedDocs });
  } catch (e) {
    console.log("Error: ", e)
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};
