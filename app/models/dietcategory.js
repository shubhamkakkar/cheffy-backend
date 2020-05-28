/**
* @Model: Plates
* DietCategory created by user/chef
*/
module.exports = (sequelize, DataTypes) => {
  const DietCategory = sequelize.define('DietCategory', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  });

  DietCategory.associate = function(models) {
    DietCategory.belongsTo(models.User, { as: 'user', foreignKey: 'userId', onDelete: 'cascade'});

    DietCategory.belongsToMany(models.Plates, { through: models.PlateDietCategory, foreignKey: 'dietCategoryId' });

    models.Plates.belongsToMany(DietCategory, { through: models.PlateDietCategory, foreignKey: 'plateId' })

  }

  return DietCategory;
}
