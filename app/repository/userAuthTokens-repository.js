'use strict';
const asyncHandler = require('express-async-handler');
const { UserAuthTokens, User } = require("../models/index");

exports.getUserAuthTokens = asyncHandler(async (id,data, options = {}) => {
    const authTokens = await UserAuthTokens.findAll({
        attributes: [ 'id', 'auth_token', 'device', 'updatedAt', 'createdAt', 'ip' ],
        where:{
            id:id
        }
    });
    return authTokens;
});

exports.createUserAuthTokens = asyncHandler(async (data, options = {}) => {
    const response = await UserAuthTokens.create(data);
    return response;
});

exports.updateAuthToken = asyncHandler(async (id,token, options = {}) => {

    const response1 = await UserAuthTokens.update(
        {auth_token:token},
        {where : { id:id } }
    );

    const response2 = await User.update(
        {auth_token:token},
        {where : { id:id } }
    );
    var response = {
        UserAuthTokens : response1,
        Users : response2
    }
    return response;
});
