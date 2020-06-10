const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const ValidationContract = require("../../services/validator");
const bcrypt = require("bcrypt");
module.exports = asyncHandler(async (req, res, next) => {
    try {
        let contract = new ValidationContract();
        contract.isRequired(
            req.body.password,
            "Old password is required. field: password"
        );
        contract.isRequired(
            req.body.newPassword,
            "New password is required. field: newPassword"
        );

        if (!contract.isValid()) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: contract.errors()
            })
        }

        const existUser = req.user;

        let result = await bcrypt.compare(req.body.password, existUser.password);

        if (!result) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .send({ message: "Incorrect current Password", data: null });
        }

        existUser.password = bcrypt.hashSync(
            req.body.newPassword,
            bcrypt.genSaltSync(10)
        );
        await existUser.save();

        return res.status(HttpStatus.OK).send({
            message: "Password Changed Successfully",
        });
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/changePassword",
            error,
        });
    }
});