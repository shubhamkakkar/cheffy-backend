"use strict";

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.addColumn("OrderItems", "customPlateId", {
			type: Sequelize.INTEGER,
			AllowNull: true,
			references: {
				model: "CustomPlates",
				key: "id"
			}
		});
	},

	down: (queryInterface, Sequelize) => {
		return queryInterface.removeColumn("OrderItems", "customPlateId");
	}
};
