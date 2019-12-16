const mysql = require('mysql2/promise');

const db = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
};

exports.getModelSQLTypesQuery = async (model) => {
  const modelTypes = {};
  const conn = await mysql.createConnection(db);
  let [rows] = await conn.execute(`SHOW COLUMNS FROM ${model}`);
  if (rows) {
    rows.forEach(element => {
      modelTypes[element.Field] = {
        type: element.Type,
        allowNull: element.Null
      }
    });
  };
  conn.end();
  return modelTypes;
}

exports.getModelSQLTypes = async (model) => {
  const modelTypes = {};
  Object.keys(model.rawAttributes).forEach((attribute) => {
    modelTypes[attribute] = {
      type: model.rawAttributes[attribute].type.key,
      required: model.rawAttributes[attribute].allowNull
    }
    if (model.rawAttributes[attribute].type.key === 'ENUM') {
      modelTypes[attribute].values = model.rawAttributes[attribute].type.values;
    }
  });
  return modelTypes;
}
