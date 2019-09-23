'use strict';

var HttpStatus = require("http-status-codes");
const authService = require('../services/auth');
const repository = require('../repository/message-repository');

exports.list = async (req, res, next) => {
    let token = (req.headers['x-access-token'] != null) ? req.headers['x-access-token'] : 
    res.set('data', null) && res.set('error', 'missing-token') && res.status(HttpStatus.UNAUTHORIZED)
    .send();
    
    const token_return = await authService.decodeToken(token);
    const messages = await repository.getMessagesByUserId(token_return.id);
    res.set('data', (messages != null) ? JSON.stringify(messages) : null);
    return res.status(HttpStatus.ACCEPTED).send();
}

exports.new = async (req, res, next) => {
    const token_return = await authService.decodeToken(req.headers['x-access-token']);
    let newMessage = await repository.createConversation({
        from_userid: token_return.id,
        to_userid: req.params.to_userID,
        message: req.body.message,
        userId: token_return.id
    })
    res.set('data', JSON.stringify(newMessage));
    return res.status(HttpStatus.ACCEPTED).send();
}

exports.messages = async (req, res, next) => {
    const token_return = await authService.decodeToken(req.headers['x-access-token']);
}