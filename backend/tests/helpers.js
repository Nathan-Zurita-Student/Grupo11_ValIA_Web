const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

// Registra um usuário único e devolve token + pantryId para uso nos testes.
async function authedUser(suffix = Date.now()) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Teste',
      email: `user${suffix}@valia.com`,
      password: 'senha123',
    });
  return { token: res.body.token, pantryId: res.body.pantryId, app };
}

module.exports = { app, authedUser };
