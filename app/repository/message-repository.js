'use strict';

const { Message,sequelize } = require('../models/index');
const { getModelSQLTypesQuery } = require('../../helpers/model-type');

exports.getMessagesByUserId = async (id) => {
    let messages = await Message.findAll({
        where: { userId: id }
    })
}

exports.createConversation = async (data) => {
    try {
        let response = await Message.create({...data});
        return response;
    } catch (err) {
        return null;
    }
}

exports.getMessagesFromUser = async (userId, to_userid) => {
    try {
        let response = await Message.findAll({
            where: { userId, to_userid }
        });
        return response;
    } catch (err) {
        return null;
    }
}

exports.getModelType = async () => {
  // const res = await getModelSQLTypes(User);
  const res = await getModelSQLTypesQuery('Messages');
  return res;
}
