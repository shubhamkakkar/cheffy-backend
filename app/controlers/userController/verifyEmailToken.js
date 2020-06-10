const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const { User } = require("../../models/index");
const userConstants = require(path.resolve("app/constants/users"));
const ValidationContract = require("../../services/validator");
module.exports = asyncHandler(async (req, res, next) => {
    try {
        let contract = new ValidationContract();
        contract.isEmail(req.body.email, "Email is correct?");
        contract.isRequired(req.body.email_token, "This email token is required!");

        if (!contract.isValid()) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: contract.errors()
            })
        }

        const existUser = await User.findOne({ where: { email: req.body.email } });

        if (!existUser) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .send({ message: `User not found by email: ${req.body.email}` });
        }

        if (existUser.verification_email_status === userConstants.STATUS_VERIFIED) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: "Email Already Verified!",
                status: HttpStatus.BAD_REQUEST,
            });
        }

        if (req.body.email_token === existUser.verification_email_token) {
            existUser.verification_email_status = userConstants.STATUS_VERIFIED;
            existUser.verification_email_token = "";
            await existUser.save();

            return res.status(HttpStatus.OK).send({
                message: "Congratulations, Email successfully verified!",
                status: HttpStatus.OK,
            });
        }

        return res.status(HttpStatus.UNAUTHORIZED).send({
            message: "Token code not verified!",
            status: HttpStatus.UNAUTHORIZED,
        });
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/verifyEmailToken",
            error,
        });
    }
});