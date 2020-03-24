"use strict";
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable("Promotions", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			name: {
				allowNull: false,
				type: Sequelize.STRING
			},
			code: {
				allowNull: false,
				type: Sequelize.STRING,
				unique: true
			},
			discount: {
				allowNull: false,
				type: Sequelize.DOUBLE
			},
			status: {
				allowNull: false,
				defaultValue: false,
				type: Sequelize.BOOLEAN
			},
			validity: {
				allowNull: false,
				type: Sequelize.DATE
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE
			}
		});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.dropTable("Promotions");
	}
};
