const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const { User } = require("../../models/index");
const ValidationContract = require("../../services/validator");
const userConstants = require(path.resolve("app/constants/users"));
const mailer = require("../../services/mailer");
module.exports = asyncHandler(async (req, res, next) => {
    try {
        let contract = new ValidationContract();
        contract.isEmail(req.body.email, "This email is correct?");

        if (!contract.isValid()) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: contract.errors(),
            });
        }


        const existUser = await User.findOne({ where: { email: req.body.email } });

        if (!existUser) {
            return res.status(HttpStatus.OK).send({
                message: `User not found by email: ${req.body.email}`,
                status: HttpStatus.OK,
            });
        }

        let template = "welcome/welcome";

        if (
            req.body.template !== undefined ||
            req.body.template !== null ||
            req.body.template !== ""
        ) {
            template = "forget/forgot";
        }

        let token = ("" + Math.random()).substring(2, 6);
        console.log({ token })
        existUser.verification_email_token = token;
        existUser.verification_email_status = userConstants.STATUS_PENDING;
        await existUser.save();

        let args = {
            to: existUser.email,
            from: "Cheffy contact@cheffy.com",
            replyTo: "contact@cheffy.com",
            subject: `Email Token`,
            template,
            context: { token, user: existUser.name },
        };
        mailer.sendMail(args);
        return res.status(HttpStatus.OK).send({
            message: "Congratulations, an email with verification code has been sent!",
            status: HttpStatus.OK,
        });
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/resendEmailToken",
            error,
        });
    }
});