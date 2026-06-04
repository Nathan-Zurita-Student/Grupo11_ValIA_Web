const pg = require('pg');

const adminClient = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  password: '1545'
});

(async () => {
  try {
    console.log('🔄 Conectando como postgres...');
    await adminClient.connect();
    console.log('✅ Conectou como postgres');

    // 1. Criar usuário
    console.log('\n🔄 Criando usuário usuario...');
    await adminClient.query(`
      DROP USER IF EXISTS usuario;
      CREATE USER usuario WITH PASSWORD '1545' SUPERUSER;
    `);
    console.log('✅ Usuário usuario criado/atualizado');

    // 2. Criar banco
    console.log('\n🔄 Criando banco valia_dev...');
    try {
      await adminClient.query('DROP DATABASE IF EXISTS valia_dev');
    } catch (e) {
      console.log('   (banco já foi deletado ou não existe)');
    }
    await adminClient.query('CREATE DATABASE valia_dev OWNER usuario');
    console.log('✅ Banco valia_dev criado');

    // 3. Conectar com novo usuário
    console.log('\n🔄 Testando conexão com usuario:1545...');
    const userClient = new pg.Client({
      user: 'usuario',
      password: '1545',
      host: 'localhost',
      port: 5432,
      database: 'valia_dev'
    });
    await userClient.connect();
    console.log('✅ Conexão com usuario:1545 funcionando!');

    // 4. Criar extension UUID
    console.log('\n🔄 Criando extensões...');
    await userClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ Extensão uuid-ossp criada');

    // 5. Criar tabelas
    console.log('\n🔄 Criando tabelas...');
    await userClient.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE pantries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL DEFAULT 'Minha despensa',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE pantry_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL REFERENCES users(id),
        "pantryId" UUID NOT NULL REFERENCES pantries(id),
        role VARCHAR(50) DEFAULT 'member',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "pantryId")
      );

      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        "expiryDate" DATE NOT NULL,
        quantity INTEGER DEFAULT 1,
        category VARCHAR(50) DEFAULT 'outros',
        status VARCHAR(50) DEFAULT 'active',
        "pantryId" UUID NOT NULL REFERENCES pantries(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE consumption_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        action VARCHAR(50) NOT NULL,
        "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabelas criadas com sucesso');

    await userClient.end();
    await adminClient.end();

    console.log('\n🎉 Setup completo! Banco pronto para usar.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
