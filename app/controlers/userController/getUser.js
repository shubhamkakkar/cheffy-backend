const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const userResponseHelper = require("./helper/userResponseHelper")

module.exports = asyncHandler(async (req, res, next) => {
    try {
        const user = req.user;
        const shippingAddresses = await user.getAddress();
        const userResponse = userResponseHelper({ user });
        userResponse.address = shippingAddresses;
        return res.status(HttpStatus.OK).send({
            message: "SUCCESS",
            data: userResponse,
        });
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/getUser",
            error: error,
        });
    }
});
