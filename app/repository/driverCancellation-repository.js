'use strict';

const { DriverCancellation, sequelize } = require('../models/index');

exports.cancelOrder = async (driverId, orderId) => {
    let existCancelledOrder = await DriverCancellation.findOne({
        where: { driverId: driverId, orderId: orderId }
    })

    if(!existCancelledOrder) {
        const driverCancellation = DriverCancellation.build({
            driverId: driverId,
            orderId: orderId
        });
    
        await driverCancellation.save();
    }

    return [];
}