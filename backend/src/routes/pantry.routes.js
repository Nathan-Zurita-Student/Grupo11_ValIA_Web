const { Router } = require('express');
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/product.controller');
const productRoutes = require('./product.routes');

const router = Router();

// Produtos vivem dentro de uma despensa: /api/pantries/:pantryId/products
router.use('/:pantryId/products', productRoutes);

// Relatório de desperdício da despensa
router.get('/:pantryId/report', auth, ctrl.report);

module.exports = router;
