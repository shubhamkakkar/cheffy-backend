const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require(path.resolve('config/database.js'));

const db = {};

//const sequelize = new Sequelize(config.mysql);

const sequelize = new Sequelize('c821iyxdz9lgx1ut', 'n2ad1m9h9pnmrnhx', 'tfmdz7w8adok6587', {
  host: "umabrisfx8afs3ja.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",//config.mysql.host,
//  port: '8889',//config.mysql.port,
  dialect: 'mysql'//config.mysql.dialect
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
