const { Router } = require('express');
const auth = require('../middlewares/auth');
const { extractDate } = require('../controllers/vision.controller');

const router = Router();

// Rota protegida — só usuários autenticados podem usar a visão por IA.
router.use(auth);
router.post('/extract-date', extractDate);

module.exports = router;
