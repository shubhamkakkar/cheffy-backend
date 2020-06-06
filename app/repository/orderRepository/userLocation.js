const { ShippingAddress } = require("../../models/index");
exports.userLocation = async (data) => {
  try {
    return await ShippingAddress.findOne(
      {
        where: { userId: data },
      },
      {
        attributes: [
          "addressLine1",
          "addressLine2",
          "state",
          "city",
          "zipCode",
        ],
      }
    );
  } catch (e) {
    return { message: "Erro to return user!", error: e };
  }
};
