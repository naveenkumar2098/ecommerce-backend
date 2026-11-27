const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');

describe('information leakage', () => {
  it('DB errors do not leak internals', async () => {
    const spy = jest.spyOn(Product, 'find').mockRejectedValueOnce(new Error('secret db detail'));
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Server error' });
    expect(res.body).not.toHaveProperty('error');
    expect(JSON.stringify(res.body)).not.toContain('secret db detail');
    spy.mockRestore();
  });

  it('malformed JSON returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body).not.toHaveProperty('error');
  });

  it('oversized bodies return 413', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'x'.repeat(200 * 1024) });
    expect(res.status).toBe(413);
  });
});
