const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const ValidationContract = require("../../services/validator");
const phoneService = require("../../services/twillio");

module.exports = asyncHandler(async (req, res, next) => {
    try {
        let contract = new ValidationContract();
        contract.isRequired(req.body.country_code, "Country Code is Required!");
        contract.isRequired(req.body.phone_no, "Phone Number is Required!");

        if (!contract.isValid()) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: contract.errors(),
            });
        }

        const existUser = req.user;

        const code = ("" + Math.random()).substring(2, 6);
        console.log({ code })
        existUser.verification_phone_token = code;
        existUser.country_code = req.body.country_code;
        existUser.phone_no = req.body.phone_no;
        await existUser.save();

        let phone = req.body.country_code + req.body.phone_no;

        if (phone === null && phone === "" && phone === undefined) {
            return res.status(HttpStatus.OK).send({
                message: "error when registering: phone not found",
                status: HttpStatus.OK,
            });
        }

        await phoneService.sendMessage(phone, code);
        return res.status(HttpStatus.OK).send({
            "status": 202,
            "message": "SMS sent successfully!",
            "code": 8665,
            "moreInfo": "null"
        });
    } catch (error) {
        return res.status(HttpStatus.BAD_REQUEST).send({
            message: error.parent.sqlMessage
        })
    }
});