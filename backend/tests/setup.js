process.env.NODE_ENV = 'test';
require('dotenv').config();

const { sequelize } = require('../src/config/database');

// Antes de toda a suíte: recria todas as tabelas do zero no banco de teste.
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

// Limpa as tabelas entre os arquivos de teste para isolamento.
afterAll(async () => {
  await sequelize.close();
});
