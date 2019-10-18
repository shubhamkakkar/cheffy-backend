const bcrypt = require('bcrypt');

async function generateHash(password) {
  try {
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  generateHash
}