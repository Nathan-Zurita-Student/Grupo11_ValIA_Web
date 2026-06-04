require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User, Pantry, PantryMember, Product, ConsumptionLog } = require('./src/models');

(async () => {
  try {
    console.log('🔄 Sincronizando banco de dados...');

    // Force: true = delete existing tables
    // Force: false = preserve existing data
    await sequelize.sync({ force: false });

    console.log('✅ Banco de dados sincronizado com sucesso!');

    // Verifica conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados verificada!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao sincronizar:', err.message);
    process.exit(1);
  }
})();
