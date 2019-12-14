module.exports = (sequelize, DataTypes) => {
  const Favourite = sequelize.define('Favourites', {
  
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    CustomplateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlate',
        key: 'id'
      }
    },
    plateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      }
    },

    fav_type: {
      type: DataTypes.ENUM('plate', 'custom_plate'),
    },
  });
  Favourite.associate = function(models) {
    Favourite.belongsTo(models.User, {foreignKey: 'userId', as: 'chef', onDelete: 'cascade'})
    Favourite.belongsTo(models.CustomPlate, {foreignKey: 'CustomplateID', as: 'custom_plates'})
    Favourite.belongsTo(models.Plates, {foreignKey: 'plateId'})
        
  }
  return Favourite;
}
