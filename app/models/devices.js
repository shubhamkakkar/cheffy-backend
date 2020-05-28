"use strict";
module.exports = (sequelize, DataTypes) => {
	const Devices = sequelize.define(
		"Devices",
		{
			deviceName: {
				allowNull: false,
				type: DataTypes.STRING
			},
			deviceId: {
				allowNull: false,
				type: DataTypes.STRING,
				unique: "uniqueDevice"
			},
			deviceToken: {
				allowNull: false,
				type: DataTypes.STRING,
				unique: "uniqueDevice"
			},
			userId: {
				allowNull: false,
				type: DataTypes.INTEGER,
				unique: "uniqueDevice"
			},
			loggenIn: {
				allowNull: false,
				defaultValue: true,
				type: DataTypes.BOOLEAN
			}
		},
		{}
	);
	Devices.associate = function(models) {
		// associations can be defined here
		/*Devices.belongsTo(models.User, {
			foreignKey: "userId",
			as: "user",
			onDelete: "cascade"
		});*/
	};
	return Devices;
};
