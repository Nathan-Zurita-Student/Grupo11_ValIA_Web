const { Router } = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/auth.controller');
const { handleValidation } = require('../middlewares');

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('E-mail inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres'),
  ],
  handleValidation,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('E-mail inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  handleValidation,
  login
);

module.exports = router;
