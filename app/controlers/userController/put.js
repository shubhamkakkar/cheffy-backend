const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const userConstants = require(path.resolve("app/constants/users"));
const { User } = require("../../models/index");
const userInputFilter = require(path.resolve("app/inputfilters/user"));
const userResponseHelper = require("./helper/userResponseHelper")
const { generateHash } = require("../../../helpers/password");
const debug = require("debug")("user");

module.exports = asyncHandler(async (req, res, next) => {
    try {
        //for accepting form-data as well
        const body = req.body || {};
        const { password } = body;
        const existUser = await User.findOne({ where: { id: req.userId } });

        if (!existUser) {
            return res.status(HttpStatus.NOT_FOUND).send({
                message: "error when updating: user not found",
                status: HttpStatus.NOT_FOUND,
            });
        }

        const prevPhone = existUser.phone_no;
        const prevEmail = existUser.email;

        const updates = userInputFilter.updateFields.filter(req.body, "form-data");

        if (req.files && req.files["profile_photo"]) {
            updates.imagePath = req.files["profile_photo"][0].url;
        }

        //need to send verification email when email change
        if (req.body.email && prevEmail !== req.body.email) {
            debug("email changed");
            let pass = ("" + Math.random()).substring(2, 6);
            updates.verification_email_token = pass;
            updates.verification_email_status = userConstants.STATUS_PENDING;
        }

        //need to send verification sms when phone change
        if (req.body.phone_no && prevPhone !== req.body.phone_no) {
            debug("phone changed");
            let pass = ("" + Math.random()).substring(2, 6);
            updates.verification_phone_token = pass;
            updates.verification_email_status = userConstants.STATUS_PENDING;
        }

        /*existUser.name = req.body.name || existUser.name;
          existUser.email = req.body.email || existUser.email;
          existUser.country_code = req.body.country_code || existUser.country_code;
          existUser.phone_no = req.body.phone_no || existUser.phone_no;
          existUser.restaurant_name = req.body.restaurant_name || existUser.restaurant_name;
          existUser.location = req.body.location  || existUser.location;
          existUser.imagePath = req.body.image_path || existUser.imagePath;*/
        password ? (updates.password = await generateHash(password)) : null;

        await existUser.update(updates);

        //Check if address is present
        if (req.body.addressLine1 || req.body.addressLine2) {
            const shippingAddresses = await existUser.getAddress();
            const shippingAddress = shippingAddresses[0];

            if (req.body.addressLine1) {
                shippingAddress.addressLine1 = req.body.addressLine1;
            }

            if (req.body.addressLine2) {
                shippingAddress.addressLine2 = req.body.addressLine2;
            }

            await shippingAddress.save();
        }

        const user = await User.findOne({
            where: { id: req.userId },
            attributes: userConstants.privateSelectFields,
        });
        const userResponse = userResponseHelper({ user });

        return res.status(HttpStatus.OK).send({
            message: "Profile successfully updated!",
            data: userResponse,
        });
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/put",
            error,
        });
    }
});