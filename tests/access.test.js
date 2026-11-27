const request = require('supertest');
const app = require('../app');
const Order = require('../models/Order');
const Issue = require('../models/Issue');
const Product = require('../models/Product');
const { createUser, authHeader } = require('./helpers');

const makeProduct = (createdBy, overrides = {}) =>
  Product.create({ name: 'Widget', description: 'd', price: 10, stock: 5, category: 'c', createdBy, ...overrides });

const makeOrder = async (userId) => {
  const product = await makeProduct(userId);
  return Order.create({ user: userId, products: [{ product: product._id, quantity: 1 }], totalPrice: 10 });
};

describe('orders access control', () => {
  it('customer cannot list another users orders (403) or read their order (404)', async () => {
    const a = await createUser();
    const b = await createUser();
    const order = await makeOrder(b.user._id);

    const list = await request(app).get(`/api/orders/${b.user._id}/allOrders`).set(authHeader(a.token));
    expect(list.status).toBe(403);
    const one = await request(app).get(`/api/orders/${order._id}`).set(authHeader(a.token));
    expect(one.status).toBe(404);
  });

  it('owner and admin can read the order', async () => {
    const a = await createUser();
    const admin = await createUser({ role: 'admin' });
    const order = await makeOrder(a.user._id);
    expect((await request(app).get(`/api/orders/${order._id}`).set(authHeader(a.token))).status).toBe(200);
    expect((await request(app).get(`/api/orders/${order._id}`).set(authHeader(admin.token))).status).toBe(200);
    const list = await request(app).get(`/api/orders/${a.user._id}/allOrders`).set(authHeader(a.token));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect((await request(app).get(`/api/orders/${a.user._id}/allOrders`).set(authHeader(admin.token))).status).toBe(200);
  });
});

describe('issues access control', () => {
  const makeIssue = async (userId, orderId) =>
    Issue.create({ title: 't', description: 'd', orderId, userId });

  it('customer cannot list or read another users issues', async () => {
    const a = await createUser();
    const b = await createUser();
    const order = await makeOrder(b.user._id);
    const issue = await makeIssue(b.user._id, order._id);
    expect((await request(app).get(`/api/issues/${b.user._id}/allIssues`).set(authHeader(a.token))).status).toBe(403);
    expect((await request(app).get(`/api/issues/${issue._id}`).set(authHeader(a.token))).status).toBe(404);
  });

  it('support can read any issue and list any users issues', async () => {
    const b = await createUser();
    const support = await createUser({ role: 'support' });
    const order = await makeOrder(b.user._id);
    const issue = await makeIssue(b.user._id, order._id);
    expect((await request(app).get(`/api/issues/${issue._id}`).set(authHeader(support.token))).status).toBe(200);
    expect((await request(app).get(`/api/issues/${b.user._id}/allIssues`).set(authHeader(support.token))).status).toBe(200);
  });

  it('creating an issue for someone elses order returns 404; own order works', async () => {
    const a = await createUser();
    const b = await createUser();
    const bOrder = await makeOrder(b.user._id);
    const aOrder = await makeOrder(a.user._id);
    const bad = await request(app).post('/api/issues').set(authHeader(a.token))
      .send({ title: 't', description: 'd', orderId: String(bOrder._id) });
    expect(bad.status).toBe(404);
    const ok = await request(app).post('/api/issues').set(authHeader(a.token))
      .send({ title: 't', description: 'd', orderId: String(aOrder._id), userId: String(b.user._id), status: 'closed' });
    expect(ok.status).toBe(201);
    expect(String(ok.body.userId)).toBe(String(a.user._id));
    expect(ok.body.status).toBe('open');
  });

  it('issue creation with a non-ObjectId orderId returns 422', async () => {
    const a = await createUser();
    const res = await request(app).post('/api/issues').set(authHeader(a.token))
      .send({ title: 't', description: 'd', orderId: 'abc' });
    expect(res.status).toBe(422);
  });

  it('support can only update status', async () => {
    const b = await createUser();
    const support = await createUser({ role: 'support' });
    const order = await makeOrder(b.user._id);
    const issue = await makeIssue(b.user._id, order._id);
    const res = await request(app).put(`/api/issues/${issue._id}`).set(authHeader(support.token))
      .send({ status: 'resolved', description: 'tampered', userId: String(support.user._id) });
    expect(res.status).toBe(200);
    const fresh = await Issue.findById(issue._id);
    expect(fresh.status).toBe('resolved');
    expect(fresh.description).toBe('d');
    expect(String(fresh.userId)).toBe(String(b.user._id));
    const bad = await request(app).put(`/api/issues/${issue._id}`).set(authHeader(support.token)).send({ status: 'weird' });
    expect(bad.status).toBe(422);
  });
});

describe('supplier product ownership', () => {
  it('supplier cannot update, delete or toggle another suppliers product', async () => {
    const s1 = await createUser({ role: 'supplier' });
    const s2 = await createUser({ role: 'supplier' });
    const product = await makeProduct(s1.user._id);
    const url = `/api/products/${product._id}`;
    expect((await request(app).put(url).set(authHeader(s2.token)).send({ name: 'Hacked' })).status).toBe(403);
    expect((await request(app).delete(url).set(authHeader(s2.token))).status).toBe(403);
    expect((await request(app).patch(`${url}/toggle`).set(authHeader(s2.token))).status).toBe(403);
    const fresh = await Product.findById(product._id);
    expect(fresh.name).toBe('Widget');
    expect(fresh.isActive).toBe(true);
  });

  it('owner supplier and admin can modify; createdBy/isActive are not editable via update', async () => {
    const s1 = await createUser({ role: 'supplier' });
    const admin = await createUser({ role: 'admin' });
    const product = await makeProduct(s1.user._id);
    const url = `/api/products/${product._id}`;
    const upd = await request(app).put(url).set(authHeader(s1.token))
      .send({ name: 'Renamed', createdBy: String(admin.user._id), isActive: false });
    expect(upd.status).toBe(200);
    const fresh = await Product.findById(product._id);
    expect(fresh.name).toBe('Renamed');
    expect(String(fresh.createdBy)).toBe(String(s1.user._id));
    expect(fresh.isActive).toBe(true);
    expect((await request(app).patch(`${url}/toggle`).set(authHeader(admin.token))).status).toBe(200);
    expect((await request(app).put(url).set(authHeader(admin.token)).send({ price: 3 })).status).toBe(200);
    expect((await request(app).delete(url).set(authHeader(admin.token))).status).toBe(200);
    expect(await Product.findById(product._id)).toBeNull();
  });

  it('create ignores createdBy in body and rejects negative price/stock with 422', async () => {
    const s1 = await createUser({ role: 'supplier' });
    const other = await createUser({ role: 'supplier' });
    const bad = await request(app).post('/api/products').set(authHeader(s1.token))
      .send({ name: 'n', description: 'd', price: -1, stock: 1, category: 'c' });
    expect(bad.status).toBe(422);
    const badStock = await request(app).post('/api/products').set(authHeader(s1.token))
      .send({ name: 'n', description: 'd', price: 1, stock: -1, category: 'c' });
    expect(badStock.status).toBe(422);
    const ok = await request(app).post('/api/products').set(authHeader(s1.token))
      .send({ name: 'n', description: 'd', price: 1, stock: 1, category: 'c', createdBy: String(other.user._id) });
    expect(ok.status).toBe(201);
    expect(String(ok.body.createdBy)).toBe(String(s1.user._id));
  });
});
