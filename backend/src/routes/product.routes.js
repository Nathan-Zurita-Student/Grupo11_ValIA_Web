const { Router } = require('express');
const { body, param, query } = require('express-validator');
const ctrl = require('../controllers/product.controller');
const auth = require('../middlewares/auth');
const { handleValidation } = require('../middlewares');

// mergeParams permite acessar :pantryId definido na rota pai.
const router = Router({ mergeParams: true });

// Todas as rotas de produto exigem usuário autenticado.
router.use(auth);

const CATEGORIES = ['laticinios', 'carnes', 'enlatados', 'hortifruti', 'bebidas', 'outros'];

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('expiryDate')
      .isISO8601()
      .withMessage('Data de validade inválida (use AAAA-MM-DD)')
      .custom((value) => {
        // Regra de negócio central: não aceitar produto já vencido no cadastro.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(value) < today) {
          throw new Error('A data de validade não pode estar no passado');
        }
        return true;
      }),
    body('quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser um inteiro ≥ 1'),
    body('category')
      .optional()
      .isIn(CATEGORIES)
      .withMessage(`Categoria deve ser uma de: ${CATEGORIES.join(', ')}`),
  ],
  handleValidation,
  ctrl.create
);

router.get(
  '/',
  [query('category').optional().isIn(CATEGORIES).withMessage('Categoria inválida')],
  handleValidation,
  ctrl.list
);

router.get('/expiring', ctrl.expiring);

router.patch(
  '/:id/resolve',
  [
    param('id').isUUID().withMessage('ID inválido'),
    body('action').isIn(['consumed', 'discarded']).withMessage('Ação deve ser consumed ou discarded'),
  ],
  handleValidation,
  ctrl.resolve
);

module.exports = router;
