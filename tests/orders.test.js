const request = require('supertest');
const app = require('../app');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { createUser, authHeader } = require('./helpers');

const makeProduct = (createdBy, overrides = {}) =>
  Product.create({ name: 'Widget', description: 'd', price: 10.5, stock: 5, category: 'c', createdBy, ...overrides });

const place = (token, products, extra = {}) =>
  request(app).post('/api/orders').set(authHeader(token)).send({ products, ...extra });

describe('order creation', () => {
  it('computes total on the server, ignoring client totalPrice, and decrements stock', async () => {
    const admin = await createUser({ role: 'admin' });
    const c = await createUser();
    const p1 = await makeProduct(admin.user._id, { price: 10.5 });
    const p2 = await makeProduct(admin.user._id, { price: 3.33, name: 'Gadget' });
    const res = await place(c.token, [
      { product: String(p1._id), quantity: 2 },
      { product: String(p2._id), quantity: 3 },
    ], { totalPrice: 1 });
    expect(res.status).toBe(201);
    expect(res.body.totalPrice).toBe(30.99);
    expect(String(res.body.user)).toBe(String(c.user._id));
    expect((await Product.findById(p1._id)).stock).toBe(3);
    expect((await Product.findById(p2._id)).stock).toBe(2);
  });

  it('merges duplicate product lines', async () => {
    const admin = await createUser({ role: 'admin' });
    const c = await createUser();
    const p = await makeProduct(admin.user._id);
    const res = await place(c.token, [
      { product: String(p._id), quantity: 1 },
      { product: String(p._id), quantity: 2 },
    ]);
    expect(res.status).toBe(201);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].quantity).toBe(3);
    expect(res.body.totalPrice).toBe(31.5);
    expect((await Product.findById(p._id)).stock).toBe(2);
  });

  it('returns 409 on insufficient stock and leaves stock unchanged', async () => {
    const admin = await createUser({ role: 'admin' });
    const c = await createUser();
    const p = await makeProduct(admin.user._id, { stock: 2 });
    const res = await place(c.token, [{ product: String(p._id), quantity: 3 }]);
    expect(res.status).toBe(409);
    expect((await Product.findById(p._id)).stock).toBe(2);
    expect(await Order.countDocuments()).toBe(0);
  });

  it('rolls back earlier reservations when a later item fails', async () => {
    const admin = await createUser({ role: 'admin' });
    const c = await createUser();
    const p1 = await makeProduct(admin.user._id, { stock: 5 });
    const p2 = await makeProduct(admin.user._id, { stock: 1, name: 'Scarce' });
    const res = await place(c.token, [
      { product: String(p1._id), quantity: 4 },
      { product: String(p2._id), quantity: 2 },
    ]);
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Scarce');
    expect((await Product.findById(p1._id)).stock).toBe(5);
    expect((await Product.findById(p2._id)).stock).toBe(1);
  });

  it('rejects inactive or unknown products with 400', async () => {
    const admin = await createUser({ role: 'admin' });
    const c = await createUser();
    const inactive = await makeProduct(admin.user._id, { isActive: false });
    const r1 = await place(c.token, [{ product: String(inactive._id), quantity: 1 }]);
    expect(r1.status).toBe(400);
    const r2 = await place(c.token, [{ product: '64b7f0c2a1b2c3d4e5f60718', quantity: 1 }]);
    expect(r2.status).toBe(400);
    expect((await Product.findById(inactive._id)).stock).toBe(5);
  });

  it('validates the payload', async () => {
    const c = await createUser();
    expect((await place(c.token, [])).status).toBe(422);
    expect((await place(c.token, [{ product: 'abc', quantity: 1 }])).status).toBe(422);
    expect((await place(c.token, [{ product: '64b7f0c2a1b2c3d4e5f60718', quantity: 0 }])).status).toBe(422);
    expect((await place(c.token, [{ product: '64b7f0c2a1b2c3d4e5f60718', quantity: 1.5 }])).status).toBe(422);
  });
});

describe('order status', () => {
  const setup = async () => {
    const admin = await createUser({ role: 'admin' });
    const c = await createUser();
    const p = await makeProduct(admin.user._id, { stock: 5 });
    const res = await place(c.token, [{ product: String(p._id), quantity: 2 }]);
    return { admin, c, p, order: res.body };
  };

  it('cancelling restores stock exactly once', async () => {
    const { admin, p, order } = await setup();
    expect((await Product.findById(p._id)).stock).toBe(3);
    const r1 = await request(app).put(`/api/orders/${order._id}`).set(authHeader(admin.token)).send({ status: 'cancelled' });
    expect(r1.status).toBe(200);
    expect(r1.body.status).toBe('cancelled');
    expect((await Product.findById(p._id)).stock).toBe(5);
    const r2 = await request(app).put(`/api/orders/${order._id}`).set(authHeader(admin.token)).send({ status: 'cancelled' });
    expect(r2.status).toBe(200);
    expect((await Product.findById(p._id)).stock).toBe(5);
  });

  it('deleting a cancelled order does not restock again', async () => {
    const { admin, p, order } = await setup();
    await request(app).put(`/api/orders/${order._id}`).set(authHeader(admin.token)).send({ status: 'cancelled' });
    const del = await request(app).delete(`/api/orders/${order._id}`).set(authHeader(admin.token));
    expect(del.status).toBe(200);
    expect((await Product.findById(p._id)).stock).toBe(5);
  });

  it('invalid status returns 422 and other fields are not writable', async () => {
    const { admin, c, order } = await setup();
    const bad = await request(app).put(`/api/orders/${order._id}`).set(authHeader(admin.token)).send({ status: 'bogus' });
    expect(bad.status).toBe(422);
    const ok = await request(app).put(`/api/orders/${order._id}`).set(authHeader(admin.token))
      .send({ status: 'shipped', totalPrice: 0, user: String(admin.user._id) });
    expect(ok.status).toBe(200);
    const fresh = await Order.findById(order._id);
    expect(fresh.status).toBe('shipped');
    expect(fresh.totalPrice).toBe(21);
    expect(String(fresh.user)).toBe(String(c.user._id));
  });

  it('cancelled orders cannot be reopened', async () => {
    const { admin, order } = await setup();
    await request(app).put(`/api/orders/${order._id}`).set(authHeader(admin.token)).send({ status: 'cancelled' });
    const res = await request(app).put(`/api/orders/${order._id}`).set(authHeader(admin.token)).send({ status: 'processing' });
    expect(res.status).toBe(400);
  });

  it('customers cannot update orders', async () => {
    const { c, order } = await setup();
    const res = await request(app).put(`/api/orders/${order._id}`).set(authHeader(c.token)).send({ status: 'cancelled' });
    expect(res.status).toBe(403);
  });
});
