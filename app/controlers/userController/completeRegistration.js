const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const userResponseHelper = require("./helper/userResponseHelper")
const { User } = require("../../models/index");
const userConstants = require(path.resolve("app/constants/users"));
const ValidationContract = require("../../services/validator");
const bcrypt = require("bcrypt");
const debug = require("debug")("user");
const authService = require("../../services/auth");

module.exports = asyncHandler(async (req, res, next) => {
    try {
        let {
            device_id,
            email,
            name,
            password,
            user_type,
            addressLine1,
            addressLine2,
            skip_doc,
            promotionalContent,
            restaurant_name
        } = req.body;

        let contract = new ValidationContract();
        contract.isEmail(email, "This email is correct?");
        contract.isRequired(name, "Name is required!");
        contract.isRequired(password, "User password is required!");
        contract.isRequired(user_type, "User type is required!");

        if (user_type === userConstants.USER_TYPE_CHEF) {
            contract.isRequired(
                restaurant_name,
                "Restaurant name is required!"
            );
        }

        if (!contract.isValid()) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: contract.errors()
            })
        }

        const existUser = await User.findOne({ where: { email } });

        //Check if address is present
        if (addressLine1 || addressLine2) {
            const shippingAddresses = await existUser.getAddress();
            const shippingAddress = shippingAddresses[0];

            if (addressLine1) {
                shippingAddress.addressLine1 = addressLine1;
            }

            if (addressLine2) {
                shippingAddress.addressLine2 = addressLine2;
            }

            await shippingAddress.save();
        }

        if (!existUser) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: `E-Mail not found, email: ${email}`,
                status: HttpStatus.BAD_REQUEST,
            });
        }
        debug("existing user", existUser.get({ plain: true }));

        debug("email status: ", existUser.verification_email_status);
        if (existUser.verification_email_status !== userConstants.STATUS_VERIFIED) {
            return res.status(HttpStatus.UNAUTHORIZED).send({
                message: "Token code not verified!",
                status: HttpStatus.UNAUTHORIZED,
            });
        }

        existUser.name = name;
        existUser.user_type = user_type;
        existUser.password = bcrypt.hashSync(
            password,
            bcrypt.genSaltSync(10)
        );
        existUser.skip_doc = skip_doc;

        existUser.promotionalContent = promotionalContent;

        /*if (existUser.user_type === userConstants.USER_TYPE_DRIVER && existUser.isNewRecord) {
              await driverAPI.createDriver({
                  name: existUser.name,
                  email: existUser.email,
              });
          }*/

        if (existUser.user_type === userConstants.USER_TYPE_CHEF) {
            existUser.restaurant_name = restaurant_name;
        }

        // generate token
        const token = await authService.generateToken({
            id: existUser.id,
            email: existUser.email,
        });

        // save token in user auth_token field.
        // for tracking logout
        existUser.auth_token = token;
        device_id ? (existUser.device_id = device_id) : null;

        await existUser.save();

        const userResponse = userResponseHelper({ user: existUser });

        return res.status(HttpStatus.CREATED).send({
            message: `Congratulations, successfully created ${user_type} type user!`,
            status: HttpStatus.CREATED,
            result: userResponse,
            token: token,
        });
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/completeRegisration",
            error,
        });
    }
});