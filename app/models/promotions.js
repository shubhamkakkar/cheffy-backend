"use strict";
module.exports = (sequelize, DataTypes) => {
	const Promotions = sequelize.define(
		"Promotions",
		{
			name: {
				allowNull: false,
				type: DataTypes.STRING
			},
			code: {
				allowNull: false,
				type: DataTypes.STRING
			},
			discount: {
				allowNull: false,
				type: DataTypes.DOUBLE
			},
			status: {
				allowNull: false,
				defaultValue: false,
				type: DataTypes.BOOLEAN
			},
			validity: {
				allowNull: false,
				type: DataTypes.DATE
			}
		},
		{}
	);
	Promotions.associate = function(models) {
		// associations can be defined here
	};
	return Promotions;
};
