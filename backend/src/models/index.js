const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── Usuário ────────────────────────────────────────────────────────────────
const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'users' }
);

// ─── Despensa ─────────────────────────────────────────────────────────────────
const Pantry = sequelize.define(
  'Pantry',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Minha despensa' },
  },
  { tableName: 'pantries' }
);

// ─── Membro da despensa (junção N:N entre User e Pantry) ──────────────────────
const PantryMember = sequelize.define(
  'PantryMember',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    role: { type: DataTypes.ENUM('owner', 'member'), defaultValue: 'member' },
  },
  { tableName: 'pantry_members' }
);

// ─── Produto ──────────────────────────────────────────────────────────────────
const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: 'outros' },
    status: {
      type: DataTypes.ENUM('active', 'consumed', 'discarded'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  { tableName: 'products' }
);

// ─── Histórico de consumo/descarte ────────────────────────────────────────────
const ConsumptionLog = sequelize.define(
  'ConsumptionLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    action: { type: DataTypes.ENUM('consumed', 'discarded'), allowNull: false },
  },
  { tableName: 'consumption_logs' }
);

// ─── Associações ──────────────────────────────────────────────────────────────
User.belongsToMany(Pantry, { through: PantryMember, foreignKey: 'userId' });
Pantry.belongsToMany(User, { through: PantryMember, foreignKey: 'pantryId' });

Pantry.hasMany(Product, { foreignKey: 'pantryId', onDelete: 'CASCADE' });
Product.belongsTo(Pantry, { foreignKey: 'pantryId' });

Product.hasMany(ConsumptionLog, { foreignKey: 'productId', onDelete: 'CASCADE' });
ConsumptionLog.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(ConsumptionLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
ConsumptionLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, Pantry, PantryMember, Product, ConsumptionLog };
