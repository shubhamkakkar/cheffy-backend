'use strict';

const { Message,sequelize } = require('../models/index');

exports.getMessagesByUserId = async (id) => {
    try {
        let messages = await Message.findAll({
            where: { userId: id }
        });
        return messages;
    } catch(err) {
        console.log(err);
        return null;
    }
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