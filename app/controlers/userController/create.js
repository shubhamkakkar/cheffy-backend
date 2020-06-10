("use strict");
const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const userConstants = require(path.resolve("app/constants/users"));
const appConstants = require(path.resolve("app/constants/app"));
const events = require(path.resolve("app/services/events"));
const { User, Documents } = require("../../models/index");
const ValidationContract = require("../../services/validator");
const sendMail = require("./helper/sendMail");
module.exports = asyncHandler(async (req, res, next) => {
  try {
    let payload = {};
    const { email } = req.body;

    let contract = new ValidationContract();
    contract.isEmail(email, "Invalid email");
    contract.isRequired(email, "Email is required");

    if (!contract.isValid()) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: contract.errors(),
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const existUser = await User.findOne({ where: { email } });

    if (existUser && existUser.verification_email_status === "pending") {
      const doc = await Documents.findOne({
        where: { userId: existUser.id },
      });
      let pass = ("" + Math.random()).substring(2, 6);
      existUser.verification_email_token = pass;
      await existUser.save();

      const { id, verification_email_status, password } = existUser;

      await sendMail({ req, pass });

      //publish create action
      events.publish(
        {
          action: "email-token-resend",
          user: existUser.get({}),
          query: req.query,
          //registration can be by any user so scope is all
          scope: appConstants.SCOPE_ALL,
          type: "user",
        },
        req
      );

      return res.status(HttpStatus.OK).send({
        message: "Email Token Re-sent!",
        status: HttpStatus.OK,
        result: {
          id,
          email,
          verification_email_status,
          password_generated: !!password,
          user_doc: !!doc,
        },
      });
    }

    if (existUser && existUser.id) {
      const doc = await Documents.findOne({
        where: { userId: existUser.id },
      });
      return res.status(HttpStatus.OK).send({
        message: "Already registered user",
        result: {
          user_type: existUser.user_type,
          verification_email_status: existUser.verification_email_status,
          password_generated: !!existUser.password,
          user_doc: !!doc,
        },
        status: HttpStatus.OK,
      });
    }

    let full_data = req.body;
    const user = await User.create({ ...full_data });
    let pass = ("" + Math.random()).substring(2, 6);
    user.verification_email_token = pass;
    await user.save();

    const newuser = await User.findOne({
      where: { id: user.id },
      attributes: userConstants.privateSelectFields,
    });

    // payload.token = token;
    payload.result = newuser;

    payload.status = HttpStatus.CREATED;

    //send email after sending response
    await sendMail({ req, pass });

    //publish create action
    events.publish(
      {
        action: "create",
        user: newuser.get({}),
        query: req.query,
        //registration can be by any user so scope is all
        scope: appConstants.SCOPE_ALL,
        type: "user",
      },
      req
    );
    return res.status(payload.status).send(payload);
  } catch (error) {
    console.log({ error });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/usercontoller/create",
      error: error,
    });
  }
});
