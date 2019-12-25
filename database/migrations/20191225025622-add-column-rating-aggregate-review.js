'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('AggregateReviews', 'rating', {
      type: Sequelize.DOUBLE,
      defaultValue: false
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('AggregateReviews', 'rating');
  }
};
