'use strict';
const HttpStatus = require('http-status-codes');

const paginator = (req) => {

  let page = req.query.page ? req.query.page : 1;
  let pageSize = req.query.pageSize ? req.query.pageSize : 10;

  const offset = page * pageSize;
  const limit = pageSize;

  return {
    offset,
    limit,
    __FROM__: offset,
    __TO__: offset+limit
  };
};

exports.paginateQuery = paginator;

exports.paginateInfo = (query) => {
  return {
    page: {from: query.__FROM__, to: query.__TO__}
  };
}
