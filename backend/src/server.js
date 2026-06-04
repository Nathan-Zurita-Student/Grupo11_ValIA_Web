require('dotenv').config();
const { createApp } = require('./app');
const { sequelize } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    // sync() cria as tabelas a partir dos modelos. Em produção, prefira migrations.
    await sequelize.sync();
    console.log('Banco de dados conectado e sincronizado.');

    const app = createApp();
    app.listen(PORT, () => console.log(`ValIA API rodando na porta ${PORT}`));
  } catch (err) {
    console.error('Falha ao iniciar o servidor:', err.message);
    process.exit(1);
  }
}

start();
