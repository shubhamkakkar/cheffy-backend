'use strict';

const { Message,sequelize } = require('../models/index');

exports.getMessagesByUserId = async (id) => {
    let messages = await Message.findAll({
        where: { userId: id }
    })
}