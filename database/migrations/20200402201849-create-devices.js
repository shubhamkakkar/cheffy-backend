"use strict";
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable(
			"Devices",
			{
				id: {
					allowNull: false,
					autoIncrement: true,
					primaryKey: true,
					type: Sequelize.INTEGER
				},
				deviceName: {
					allowNull: false,
					type: Sequelize.STRING
				},
				deviceId: {
					allowNull: false,
					type: Sequelize.STRING,
					unique: "uniqueDevice"
				},
				deviceToken: {
					allowNull: false,
					type: Sequelize.STRING,
					unique: "uniqueDevice"
				},
				userId: {
					allowNull: false,
					type: Sequelize.INTEGER,
					unique: "uniqueDevice"
				},
				loggenIn: {
					allowNull: false,
					defaultValue: true,
					type: Sequelize.BOOLEAN
				},
				createdAt: {
					allowNull: false,
					type: Sequelize.DATE
				},
				updatedAt: {
					allowNull: false,
					type: Sequelize.DATE
				}
			},
			{
				uniqueKeys: {
					uniqueDevice: {
						fields: ["deviceId", "deviceToken", "userId"]
					}
				}
			}
		);
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.dropTable("Devices");
	}
};
