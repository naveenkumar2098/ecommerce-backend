const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const { createUser, authHeader } = require('./helpers');

describe('robustness', () => {
  it('product create validation failure returns 422 JSON', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await request(app).post('/api/products').set(authHeader(admin.token)).send({});
    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('product update validation failure returns 422 JSON', async () => {
    const admin = await createUser({ role: 'admin' });
    const p = await Product.create({ name: 'n', description: 'd', price: 1, stock: 1, category: 'c', createdBy: admin.user._id });
    const res = await request(app).put(`/api/products/${p._id}`).set(authHeader(admin.token)).send({ price: -5 });
    expect(res.status).toBe(422);
  });

  it('GET /api/products/:id works and POST no longer does', async () => {
    const admin = await createUser({ role: 'admin' });
    const p = await Product.create({ name: 'n', description: 'd', price: 1, stock: 1, category: 'c', createdBy: admin.user._id });
    const get = await request(app).get(`/api/products/${p._id}`);
    expect(get.status).toBe(200);
    expect(get.body.name).toBe('n');
    const post = await request(app).post(`/api/products/${p._id}`);
    expect(post.status).toBe(404);
  });

  it('invalid ObjectIds return 400 on id routes', async () => {
    const admin = await createUser({ role: 'admin' });
    const h = authHeader(admin.token);
    expect((await request(app).get('/api/orders/not-an-id').set(h)).status).toBe(400);
    expect((await request(app).get('/api/orders/not-an-id/allOrders').set(h)).status).toBe(400);
    expect((await request(app).get('/api/issues/not-an-id').set(h)).status).toBe(400);
    expect((await request(app).get('/api/issues/not-an-id/allIssues').set(h)).status).toBe(400);
    expect((await request(app).get('/api/products/not-an-id')).status).toBe(400);
    expect((await request(app).put('/api/products/not-an-id').set(h).send({})).status).toBe(400);
    expect((await request(app).delete('/api/users/not-an-id').set(h)).status).toBe(400);
    expect((await request(app).put('/api/users/not-an-id').set(h).send({})).status).toBe(400);
  });

  it('PUT /api/users/me/update still resolves to the own-profile handler', async () => {
    const c = await createUser();
    const res = await request(app).put('/api/users/me/update').set(authHeader(c.token)).send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
  });

  it('inactive products are hidden from the public list and detail', async () => {
    const admin = await createUser({ role: 'admin' });
    const base = { description: 'd', price: 1, stock: 1, category: 'c', createdBy: admin.user._id };
    await Product.create({ ...base, name: 'visible' });
    const hidden = await Product.create({ ...base, name: 'hidden', isActive: false });
    const list = await request(app).get('/api/products');
    expect(list.body.map((p) => p.name)).toEqual(['visible']);
    expect((await request(app).get(`/api/products/${hidden._id}`)).status).toBe(404);
  });
});
