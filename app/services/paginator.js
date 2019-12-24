'use strict';
const HttpStatus = require('http-status-codes');

const paginator = (req) => {

  let page = req.query.page ? (Number(req.query.page)-1) : 0;
  let pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

  const offset = page * pageSize;
  const limit = pageSize;

  return {
    offset,
    limit,
    __FROM__: offset === 0 ? 1 : offset,
    __TO__: offset+limit
  };
};

exports.paginateQuery = paginator;

exports.paginateInfo = (paginationQuery) => {
  return {
    page: {from: paginationQuery.__FROM__, to: paginationQuery.__TO__}
  };
}
