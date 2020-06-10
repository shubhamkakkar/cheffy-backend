const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const authService = require("../../services/auth");

module.exports = asyncHandler(async (req, res, next) => {
    let token = req.headers["x-access-token"];
    if (!token) {
        return res
            .status(HttpStatus.BAD_REQUEST)
            .send({ message: "Access token is not found" });
    }
    try {
        let token_return = await authService.decodeToken(token);
        return res.status(HttpStatus.OK).send(token_return);
    } catch (error) {
        return res.status(409).send({ message: "Token expired", error: error });
    }
});