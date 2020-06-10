const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const userResponseHelper = require("./helper/userResponseHelper")
const { User } = require("../../models/index");
const userConstants = require(path.resolve("app/constants/users"));
const repositoryRating = require(path.resolve(
    "app/repository/rating-repository"
));
module.exports = asyncHandler(async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.userId, {
            attributes: userConstants.privateSelectFields,
        });

        if (!user) {
            return res
                .status(HttpStatus.NOT_FOUND)
                .send({ message: "User not found", status: HttpStatus.NOT_FOUND });
        }
        const shippingAddresses = await user.getAddress();
        const userResponse = userResponseHelper({ user });
        if (userConstants.USER_TYPE_CHEF === user.user_type) {
            let rating = await repositoryRating.getRatingofChef(req.params.userId);
            let aggregate_rating = rating.rating + "(" + rating.userCount + ")";
            userResponse.rating = rating;
            userResponse.aggregate_rating = aggregate_rating;
        }
        userResponse.address = shippingAddresses;
        return res.status(HttpStatus.OK).send({
            message: "SUCCESS",
            data: userResponse,
        });
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/getUserById",
            error: error,
        });
    }
});