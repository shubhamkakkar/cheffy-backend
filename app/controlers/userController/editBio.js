const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const ValidationContract = require("../../services/validator");
const userInputFilter = require(path.resolve("app/inputfilters/user"));
const { User } = require("../../models/index");
const userConstants = require(path.resolve("app/constants/users"));

module.exports = asyncHandler(async (req, res, next) => {
    try {
        let existUser = await User.findByPk(req.userId);
        if (!existUser) {
            return res.status(HttpStatus.NOT_FOUND).send({
                message: "error when updating: user not found",
                status: HttpStatus.NOT_FOUND,
            });
        }

        const { user_type } = existUser;

        if (user_type === userConstants.USER_TYPE_USER || user_type === userConstants.USER_TYPE_ADMIN) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: `Only ${userConstants.USER_TYPE_CHEF} and ${userConstants.USER_TYPE_DRIVER} can have bio`,
            });
        }

        const { bio } = req.body;
        let contract = new ValidationContract();

        contract.isRequired(
            bio,
            "bio is requied"
        );

        if (!contract.isValid()) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message: contract.errors(),
            });
        }

        if (bio.trim().length) {
            existUser.bio = bio;
            await existUser.save();
            return res.status(HttpStatus.OK).send({
                message: "bio updated!",
            });

        } else {
            return res.status(HttpStatus.BAD_REQUEST).send({
                message:
                    "Can not set bio to empty string",
            });
        }
    } catch (error) {
        console.log({ error });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            messege: "Something went wrong, we will get back to you shortly",
            file: "/usercontoller/put",
            error,
        });
    }
});