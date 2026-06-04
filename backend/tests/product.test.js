const request = require('supertest');
const { app, authedUser } = require('./helpers');

// Datas relativas para os testes não vencerem com o tempo.
const inDays = (n) => {
  const d = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

describe('Produtos — /api/pantries/:pantryId/products', () => {
  let token, pantryId;

  beforeAll(async () => {
    ({ token, pantryId } = await authedUser('prod'));
  });

  it('exige autenticação', async () => {
    const res = await request(app).get(`/api/pantries/${pantryId}/products`);
    expect(res.status).toBe(401);
  });

  it('cadastra um produto válido', async () => {
    const res = await request(app)
      .post(`/api/pantries/${pantryId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Leite', expiryDate: inDays(10), quantity: 2, category: 'laticinios' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Leite');
    expect(res.body.urgency.level).toBe('verde');
  });

  it('rejeita produto com data de validade no passado', async () => {
    const res = await request(app)
      .post(`/api/pantries/${pantryId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Iogurte', expiryDate: inDays(-5), quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.details[0].mensagem).toMatch(/passado/);
  });

  it('rejeita quantidade inválida', async () => {
    const res = await request(app)
      .post(`/api/pantries/${pantryId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pão', expiryDate: inDays(3), quantity: 0 });
    expect(res.status).toBe(400);
  });

  it('classifica urgência como vermelho para vencimento em 1 dia', async () => {
    const res = await request(app)
      .post(`/api/pantries/${pantryId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Queijo', expiryDate: inDays(1), quantity: 1 });
    expect(res.status).toBe(201);
    expect(res.body.urgency.level).toBe('vermelho');
  });

  it('lista produtos ordenados pela proximidade do vencimento', async () => {
    const res = await request(app)
      .get(`/api/pantries/${pantryId}/products`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    // Primeiro item deve ter a data mais próxima.
    const datas = res.body.map((p) => p.expiryDate);
    const ordenado = [...datas].sort();
    expect(datas).toEqual(ordenado);
  });

  it('filtra produtos por categoria', async () => {
    const res = await request(app)
      .get(`/api/pantries/${pantryId}/products?category=laticinios`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.every((p) => p.category === 'laticinios')).toBe(true);
  });

  it('marca produto como consumido e gera log', async () => {
    const lista = await request(app)
      .get(`/api/pantries/${pantryId}/products`)
      .set('Authorization', `Bearer ${token}`);
    const produtoId = lista.body[0].id;

    const res = await request(app)
      .patch(`/api/pantries/${pantryId}/products/${produtoId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'consumed' });
    expect(res.status).toBe(200);
    expect(res.body.product.status).toBe('consumed');
  });

  it('gera relatório de desperdício com percentuais', async () => {
    const res = await request(app)
      .get(`/api/pantries/${pantryId}/report`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('consumedRate');
    expect(res.body).toHaveProperty('discardedRate');
    expect(res.body.consumedRate + res.body.discardedRate).toBeLessThanOrEqual(100);
  });
});
