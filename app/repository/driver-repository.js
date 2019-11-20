const { DriverFinder } = require("../models/index");
const { getModelSQLTypesQuery } = require('../../helpers/model-type');

exports.getModelType = async (option) => {
  let res = '';
  if (option === 'driverFinders') {
    res = await getModelSQLTypesQuery('DriverFinders');
  }
  return res;
}
