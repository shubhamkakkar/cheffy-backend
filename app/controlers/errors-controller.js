'use strict';

const path = require('path');
const HttpStatus = require("http-status-codes");
const debug = require('debug')('errors');
const logger = require(path.resolve('./server/logger'));

/**
 *
 * @param error
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.errorHandler = function(error, req, res, next) {

  // If the error object doesn't exists
  if(error === undefined) {
    return;
  }

  if (!error) return next();

  if(res.headersSent) {
     return exports.logError(error,req);
  }
  const notFoundMessage = 'Not Found';
  //for example id not sent as integer number
  if (error.name === 'CastError') {
    if (process.env.NODE_ENV === 'production') {
      exports.logError(error,req);

      return res.status(HttpStatus.NOT_FOUND).send({message: notFoundMessage, status: HttpStatus.NOT_FOUND});
    }

    return res.status(HttpStatus.BAD_REQUEST).send({message:'cast_error', status: HttpStatus.BAD_REQUEST, ...error});

  }

  if(error.status === HttpStatus.NOT_FOUND) {
    exports.logError(error,req);
    return res.status(HttpStatus.NOT_FOUND).send({message:error.message || notFoundMessage, status: HttpStatus.NOT_FOUND});
  }

  if(error.status === HttpStatus.BAD_REQUEST) {

    exports.logError(error,req);

    return res.status(HttpStatus.BAD_REQUEST).send({message:error.message || 'not_found', status: HttpStatus.BAD_REQUEST});
  }

  //TODO check for sequelize error as well. send 4xx errors when validation occurs

  if(error.type && error.type === 'StripeInvalidRequestError') {
    return res.status(HttpStatus.BAD_REQUEST).send({message: error.message, ...error})
  }

  // Log it
  exports.logError(error,req);

  if(process.env.NODE_ENV === 'production') {
    //return res.status(500).send({message:'internal_server_error');
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: 'Internal Server Error', status: HttpStatus.INTERNAL_SERVER_ERROR});
  }

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message:'Internal Server Error', error: error.message, stack: error.stack, status: HttpStatus.INTERNAL_SERVER_ERROR});

};

exports.noAPIMiddlewareResponded = function(req, res) {
  if(res.headersSent) {
     return exports.logError(new Error('noApiMiddlewareResponded'), req);
  }

  exports.logError(new Error(`noAPIMiddlewareResponded: ${req.url}`), req);
  return res.status(404).send({message:'noApiMiddlewareResponded. Please see the API for reference'});
};

/**
 * POST
 * Browser Error handler if there is a web app
 * @param req
 * @param res
 * @param next
 */

exports.postBrowserError = (req, res, next) => {
  exports.logBrowserError(req, req.body);
  res.status(200).json({message: 'ok'});
};


/**
* Log server error in log files
*/
exports.logError = function(error, req) {
  if(!error instanceof Error) {
    if(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      throw Error('error object should be instance of error');
    }
  }

  if (process.env.NODE_ENV === 'production') {
    //TODO
    //log error in bug tracking service or slack
    return logger.error(error);
  }

  console.log(error);

};

/**
 * Log browser error in log file and slack
 * @param req
 * @param body
 */
exports.logBrowserError = function(req, body = {}) {
  if (process.env.NODE_ENV === 'production') {
    const fileLogContents = { ...body };

    //delete screenshot field for loggin in file
    if(fileLogContents.screenshot) {
      delete fileLogContents.screenshot;
    }
    return logger.warn(fileLogContents, 'browser-error');
  }
  //delete screenshot dataURL for not polluting the console
  delete body.screenshot;
  console.log('browser-error');
  console.error(body);
  return;

};
