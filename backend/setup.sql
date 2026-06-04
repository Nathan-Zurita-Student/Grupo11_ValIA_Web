-- Criar usuário se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'usuario') THEN
    CREATE USER usuario WITH PASSWORD '1545';
  END IF;
END
$$;

-- Dar permissões de superuser
ALTER USER usuario WITH SUPERUSER;

-- Criar banco se não existir
SELECT 'CREATE DATABASE valia_dev OWNER usuario'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'valia_dev')\gexec

-- Conectar ao banco e criar tabelas
\c valia_dev

-- Criar extension UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabelas
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS pantries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL DEFAULT 'Minha despensa'
);

CREATE TABLE IF NOT EXISTS pantry_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id),
  "pantryId" UUID NOT NULL REFERENCES pantries(id),
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  UNIQUE("userId", "pantryId")
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  "expiryDate" DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  category VARCHAR(50) NOT NULL DEFAULT 'outros',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'discarded')),
  "pantryId" UUID NOT NULL REFERENCES pantries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consumption_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(50) NOT NULL CHECK (action IN ('consumed', 'discarded')),
  "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

\echo '✅ Setup completo!'
