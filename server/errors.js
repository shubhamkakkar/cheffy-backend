'use strict';

const path = require('path'),
  errorsController = require(path.resolve('app/controlers/errors-controller'));

module.exports = (app) => {

  app.use((req, res, next) => {
    req.on('error', (err) => {
      //TODO log error here
      errorsController.logError(err, req);
      res.end();
    });
    next();
  });

  app.use(errorsController.errorHandler);

  // Assume 404 since no middleware responded
  //don't send no middleware found for tmp request
  app.use('/api', errorsController.noAPIMiddlewareResponded);

  //this is giving problem for static route /tmp
  //app.use(errorsController.noAPIMiddlewareResponded);
};
