'use strict';
var HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const { User,sequelize } = require('../models/index');

exports.updateDriverPosition = async (req, res, next) => {
    let payload = {};

    let contract = new ValidationContract();
    contract.hasisRequiredMinLen(req.body.latitude, 10, 'You must provide latitude');
    contract.isRequired(req.body.longitude, 'You must provide longitude');
  
    if (!contract.isValid()) {
      res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
      return 0;
    }

    const token_return = await authService.decodeToken(req.headers['x-access-token'])

    const existUser = await User.findOne({ where: { id: token_return.id } });

    if (!existUser) {
        payload.status = HttpStatus.CONFLICT;
        res.status(payload.status).send({ message: 'Could not update user position', status: HttpStatus.CONFLICT});
        return 0;
   }
}
