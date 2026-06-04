const { validationResult } = require('express-validator');

// Coleta os erros gerados pelas regras do express-validator.
// Usado como último middleware das rotas que têm validação.
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map((e) => ({ campo: e.path, mensagem: e.msg })),
    });
  }
  next();
}

// Middleware global de erros — registrado por último no app.
// Captura qualquer exceção não tratada e devolve resposta padronizada.
function errorHandler(err, req, res, next) {
  console.error(`[ERRO] ${req.method} ${req.path} →`, err.message);

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Registro já existe' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
}

module.exports = { handleValidation, errorHandler };
