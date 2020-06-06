const { User } = require("../../models/index");
exports.user = async (data) => {
  try {
    return await User.findByPk(data);
  } catch (e) {
    return { message: "Erro to return user!", error: e };
  }
};
