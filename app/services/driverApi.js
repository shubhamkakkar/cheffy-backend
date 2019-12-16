const axios = require('axios');

const connection = axios.create({
  baseURL: process.env.DRIVER_API_URL,
});

exports.createDriver = (data) => connection.post('/driver/register', data);

exports.updateDriverPosition = (data) => connection.post('/driver/set-location', data);

exports.getDriverPosition = (data) => connection.post('/driver/get-location', data);

exports.createBankAccount = (data) => connection.post('/driver/bank/add-account', data);