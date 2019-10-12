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
    let token = (req.headers['x-access-token'] != null) ? req.headers['x-access-token'] :
    res.set('data', null) && res.set('error', 'missing-token') && res.status(HttpStatus.UNAUTHORIZED)
    .send();

    const token_return = await authService.decodeToken(token);
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
    let token = (req.headers['x-access-token'] != null) ? req.headers['x-access-token'] :
    res.set('data', null) && res.set('error', 'missing-token') && res.status(HttpStatus.UNAUTHORIZED)
    .send();

    const token_return = await authService.decodeToken(token);

    let messages = await repository.getMessagesFromUser(token_return.id, req.params.to_userID);

    res.set('data', JSON.stringify(messages));
    return res.status(HttpStatus.ACCEPTED).send();
}

exports.getModelType = async (req, res, next) => {
  try {
    const dataTypes = await repository.getModelType();
    res.status(200).json(dataTypes);
  } catch (e) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "Fail to getting model types",
      error: e
    });
  }
};
