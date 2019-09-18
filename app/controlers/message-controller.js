'use strict';

var HttpStatus = require("http-status-codes");
const authService = require('../services/auth');
const repository = require('../repository/message-repository');

exports.list = async (req, res, next) => {
    const token_return = await authService.decodeToken(req.headers['x-access-token']);
    const messages = await repository.getMessagesByUserId(token_return.id);
    return res.status(HttpStatus.ACCEPTED).send({ message: 'Your list of messages', data: messages });
}

exports.new = async (req, res, next) => {
    const token_return = await authService.decodeToken(req.headers['x-access-token']);
    let newMessage = await repository.createConversation({

        userId: token_return.id
    })
}

exports.messages = async (req, res, next) => {
    const token_return = await authService.decodeToken(req.headers['x-access-token']);
}