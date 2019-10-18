"use strict";
var HttpStatus = require('http-status-codes');

exports.success = async (req, res, next) => {
  console.log(req.query)
  console.log(req.body)
}
exports.cancel = async (req, res, next) => {
  console.log(req.query)
  console.log(req.body)
}
