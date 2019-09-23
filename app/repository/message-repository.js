'use strict';

const { Message,sequelize } = require('../models/index');

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
        console.log(err);
    }
}