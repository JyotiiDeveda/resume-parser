module.exports = {
  up: queryInterface => {
    return queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "vector";');
  },
  down: queryInterface => {
    return queryInterface.sequelize.query('DROP EXTENSION "vector";');
  }
};
