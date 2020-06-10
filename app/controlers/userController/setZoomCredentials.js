const path = require("path")
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const ValidationContract = require("../../services/validator");
const userInputFilter = require(path.resolve("app/inputfilters/user"));

module.exports = asyncHandler(async (req, res, next) => {
    try {
        let contract = new ValidationContract();
        contract.isRequired(req.body.zoom_id, "Zoom Id is Required!");
        contract.isRequired(req.body.zoom_pass, "Zoom Password is Required!");

        if (!contract.isValid()) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: contract.errors(),
            });
        }

        const user = req.user;

        const updates = userInputFilter.updateFields.filter(req.body);

        await user.update(updates);
        return res.status(HttpStatus.OK).send({
            message: "zoom credentials saved",
            status: HttpStatus.OK,
        });
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/setZoomCredentials",
            error,
        });
    }
});