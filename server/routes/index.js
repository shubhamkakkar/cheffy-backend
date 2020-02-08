const logger = require('morgan')
const v1 = require('./v1');
const v2 = require('./v2');


module.exports = (app) => {
  app.use(logger('dev'))
  //route used now
  app.use('/', v1);

  app.use('/api/v1', v1);

  /*
  * alias of v1 with proper route naming standards
  */
  app.use('/api/v2', v2);

  /*
  * future
  * separate into modules
  * standarize responses
  */
  /*
  app.use('/api/v3', v3)
  */
}
