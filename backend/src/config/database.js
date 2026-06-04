const { Sequelize } = require('sequelize');
require('dotenv').config();

// Em produção usa-se DATABASE_URL (Postgres na nuvem — Railway/Render).
// Em testes, um banco separado evita poluir os dados de desenvolvimento.
const databaseUrl =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

module.exports = { sequelize, Sequelize };
