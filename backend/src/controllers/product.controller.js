const { Op } = require('sequelize');
const { Product, ConsumptionLog } = require('../models');

const DAY_MS = 24 * 60 * 60 * 1000;

// Calcula o nível de urgência a partir dos dias restantes até o vencimento.
// Espelha o indicador visual do app: verde / amarelo / vermelho.
function urgencyOf(expiryDate) {
  const days = Math.ceil((new Date(expiryDate) - new Date()) / DAY_MS);
  if (days < 0) return { level: 'vencido', days };
  if (days <= 1) return { level: 'vermelho', days };
  if (days <= 3) return { level: 'amarelo', days };
  return { level: 'verde', days };
}

// POST /api/pantries/:pantryId/products
async function create(req, res, next) {
  try {
    const { name, expiryDate, quantity, category } = req.body;
    const product = await Product.create({
      name,
      expiryDate,
      quantity,
      category,
      pantryId: req.params.pantryId,
    });
    return res.status(201).json({ ...product.toJSON(), urgency: urgencyOf(product.expiryDate) });
  } catch (err) {
    next(err);
  }
}

// GET /api/pantries/:pantryId/products
// Lista produtos ativos ordenados pela proximidade do vencimento.
async function list(req, res, next) {
  try {
    const where = { pantryId: req.params.pantryId, status: 'active' };
    if (req.query.category) where.category = req.query.category;
    if (req.query.search) {
      where.name = { [Op.iLike]: `%${req.query.search}%` };
    }

    const products = await Product.findAll({
      where,
      order: [['expiryDate', 'ASC']],
    });

    const result = products.map((p) => ({ ...p.toJSON(), urgency: urgencyOf(p.expiryDate) }));
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/pantries/:pantryId/products/expiring?days=7
// Itens que vencem dentro de N dias — usado pelo serviço de notificações.
async function expiring(req, res, next) {
  try {
    const days = Number(req.query.days) || 7;
    const limit = new Date(Date.now() + days * DAY_MS);

    const products = await Product.findAll({
      where: {
        pantryId: req.params.pantryId,
        status: 'active',
        expiryDate: { [Op.lte]: limit },
      },
      order: [['expiryDate', 'ASC']],
    });

    return res.json(products.map((p) => ({ ...p.toJSON(), urgency: urgencyOf(p.expiryDate) })));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/pantries/:pantryId/products/:id/resolve  { action: 'consumed' | 'discarded' }
// Marca o item como consumido ou descartado e registra no histórico.
async function resolve(req, res, next) {
  try {
    const { action } = req.body;
    const product = await Product.findOne({
      where: { id: req.params.id, pantryId: req.params.pantryId },
    });

    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    product.status = action;
    await product.save();
    await ConsumptionLog.create({ action, productId: product.id, userId: req.userId });

    return res.json({ message: `Produto marcado como ${action}`, product });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/pantries/:pantryId/products/:id  { name?, expiryDate?, quantity?, category? }
async function update(req, res, next) {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, pantryId: req.params.pantryId },
    });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    const { name, expiryDate, quantity, category } = req.body;
    if (name !== undefined) product.name = name;
    if (expiryDate !== undefined) product.expiryDate = expiryDate;
    if (quantity !== undefined) product.quantity = quantity;
    if (category !== undefined) product.category = category;
    await product.save();

    return res.json({ ...product.toJSON(), urgency: urgencyOf(product.expiryDate) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/pantries/:pantryId/products/:id
async function remove(req, res, next) {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, pantryId: req.params.pantryId },
    });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    await product.destroy();
    return res.json({ message: 'Produto removido' });
  } catch (err) {
    next(err);
  }
}

// GET /api/pantries/:pantryId/report
// Relatório de desperdício: percentual de consumidos vs descartados.
async function report(req, res, next) {
  try {
    const logs = await ConsumptionLog.findAll({
      include: [{ model: Product, where: { pantryId: req.params.pantryId }, attributes: [] }],
    });

    const consumed = logs.filter((l) => l.action === 'consumed').length;
    const discarded = logs.filter((l) => l.action === 'discarded').length;
    const total = consumed + discarded;

    return res.json({
      total,
      consumed,
      discarded,
      consumedRate: total ? Math.round((consumed / total) * 100) : 0,
      discardedRate: total ? Math.round((discarded / total) * 100) : 0,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, expiring, resolve, update, remove, report, urgencyOf };
