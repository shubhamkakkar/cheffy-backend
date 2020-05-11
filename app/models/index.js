const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require(path.resolve('config/database.js'));

const db = {};

//const sequelize = new Sequelize(config.mysql);

const sequelize = new Sequelize('database_test', 'root', 'root', {
  host: 'localhost',
  port: '8889',
  dialect: 'mysql'
});

fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Override timezone formatting for MSSQL
Sequelize.DATE.prototype._stringify = function _stringify(date, options) {
  return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
};
module.exports = db;
