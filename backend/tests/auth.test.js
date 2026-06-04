const request = require('supertest');
const { app } = require('./helpers');

describe('Autenticação — /api/auth', () => {
  const user = { name: 'Ana', email: 'ana@valia.com', password: 'senha123' };

  it('registra um novo usuário e retorna token + despensa', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.pantryId).toBeDefined();
    expect(res.body.user.email).toBe('ana@valia.com');
    expect(res.body.user.password).toBeUndefined(); // nunca devolver a senha
  });

  it('rejeita registro com e-mail duplicado', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  it('rejeita registro com senha curta', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bia', email: 'bia@valia.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Dados inválidos');
  });

  it('faz login com credenciais corretas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@valia.com', password: 'senha123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejeita login com senha incorreta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@valia.com', password: 'errada' });
    expect(res.status).toBe(401);
  });
});
