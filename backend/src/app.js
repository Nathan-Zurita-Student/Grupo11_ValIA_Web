const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const pantryRoutes = require('./routes/pantry.routes');
const visionRoutes = require('./routes/vision.routes');
const { errorHandler } = require('./middlewares');

// Application Factory: cria e configura a instância do Express sem iniciá-la.
// Permite que os testes criem uma app isolada por suíte e que o server.js
// reaproveite a mesma configuração — equivalente ao create_app() do Flask.
function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Healthcheck simples para o monitor de uptime do PaaS.
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/pantries', pantryRoutes);
  app.use('/api/vision', visionRoutes);

  // Tratador de erros sempre por último.
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
