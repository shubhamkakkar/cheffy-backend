function userResponseHelper({ user }) {
    let userResponse = user.get({ plain: true });
    delete userResponse.password;
    delete userResponse.auth_token;
    return userResponse;
}


module.exports = userResponseHelper