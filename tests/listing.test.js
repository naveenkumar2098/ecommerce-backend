const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Issue = require('../models/Issue');
const { createUser, authHeader } = require('./helpers');

const makeProduct = (owner, extra = {}) =>
  Product.create({ name: 'P', description: 'd', price: 5, stock: 3, category: 'c', createdBy: owner._id, ...extra });

describe('GET /api/products/manage', () => {
  it('admin sees all products including inactive ones', async () => {
    const admin = await createUser({ role: 'admin' });
    const sup = await createUser({ role: 'supplier' });
    await makeProduct(sup.user);
    await makeProduct(sup.user, { isActive: false });
    const res = await request(app).get('/api/products/manage').set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('supplier sees only their own products, active or not', async () => {
    const s1 = await createUser({ role: 'supplier' });
    const s2 = await createUser({ role: 'supplier' });
    await makeProduct(s1.user, { isActive: false });
    await makeProduct(s2.user);
    const res = await request(app).get('/api/products/manage').set(authHeader(s1.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].isActive).toBe(false);
  });

  it('customers and anonymous callers are refused', async () => {
    const c = await createUser();
    expect((await request(app).get('/api/products/manage').set(authHeader(c.token))).status).toBe(403);
    expect((await request(app).get('/api/products/manage')).status).toBe(401);
  });
});

describe('GET /api/orders', () => {
  it('admin lists every order with the customer name', async () => {
    const admin = await createUser({ role: 'admin' });
    const c = await createUser({ name: 'Cara' });
    const sup = await createUser({ role: 'supplier' });
    const p = await makeProduct(sup.user);
    await Order.create({ user: c.user._id, products: [{ product: p._id, quantity: 1 }], totalPrice: 5 });
    const res = await request(app).get('/api/orders').set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].user.name).toBe('Cara');
    expect(res.body[0].user.password).toBeUndefined();
  });

  it('customers cannot list all orders', async () => {
    const c = await createUser();
    expect((await request(app).get('/api/orders').set(authHeader(c.token))).status).toBe(403);
  });
});

describe('GET /api/issues', () => {
  const seed = async () => {
    const c = await createUser({ name: 'Cara' });
    const sup = await createUser({ role: 'supplier' });
    const p = await makeProduct(sup.user);
    const o = await Order.create({ user: c.user._id, products: [{ product: p._id, quantity: 1 }], totalPrice: 5 });
    await Issue.create({ title: 'A', description: 'a', orderId: o._id, userId: c.user._id });
    await Issue.create({ title: 'B', description: 'b', orderId: o._id, userId: c.user._id, status: 'resolved' });
    return c;
  };

  it('support sees every issue with the customer name', async () => {
    await seed();
    const support = await createUser({ role: 'support' });
    const res = await request(app).get('/api/issues').set(authHeader(support.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].userId.name).toBe('Cara');
  });

  it('filters by status and rejects unknown statuses', async () => {
    await seed();
    const admin = await createUser({ role: 'admin' });
    const open = await request(app).get('/api/issues?status=open').set(authHeader(admin.token));
    expect(open.body).toHaveLength(1);
    expect((await request(app).get('/api/issues?status=lost').set(authHeader(admin.token))).status).toBe(422);
  });

  it('customers cannot see the issue queue', async () => {
    const c = await seed();
    expect((await request(app).get('/api/issues').set(authHeader(c.token))).status).toBe(403);
  });
});
