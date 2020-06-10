const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const ValidationContract = require("../../services/validator");
const userConstants = require(path.resolve("app/constants/users"));
const userRepository = require("../../repository/user-repository");

module.exports = asyncHandler(async (req, res, next) => {
    try {
        let contract = new ValidationContract();
        contract.isRequired(
            req.body.sms_token,
            "SMS code is required! field: sms_token"
        );

        if (!contract.isValid()) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: contract.errors(),
            });
        }

        const existUser = req.user;

        if (existUser.verification_phone_status === userConstants.STATUS_VERIFIED) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: "Phone Already Verified!",
                status: HttpStatus.BAD_REQUEST,
            });
        }

        const isVerified = await userRepository.validatePhone(
            existUser.id,
            req.body.sms_token
        );

        if (isVerified) {
            return res.status(HttpStatus.OK).send({
                message: "Congratulations, phone successfully verified!",
                status: HttpStatus.OK,
            });
        }

        return res.status(HttpStatus.BAD_REQUEST).send({
            message: "Failed verifying phone. Please try re-sending sms token again",
            status: HttpStatus.BAD_REQUEST,
        });
    } catch (error) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            message: "Something went wrong. we will get back to you shortly",
            error,
            file: "/user-contoller/verifyUserPhone",
        });
    }
});